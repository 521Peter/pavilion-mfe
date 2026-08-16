import { Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";

/** MCP 工具定义（listTools 返回） */
export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** MCP Server 运行时配置（从 DB model 平面化） */
export interface McpServerConfig {
  id: string;
  transport: string;
  command?: string | null;
  args: string[];
  env: Record<string, string>;
  url?: string | null;
  headers: Record<string, string>;
  timeout: number;
}

interface PoolEntry {
  proc?: ChildProcessWithoutNullStreams;
  connected: boolean;
  initializing?: Promise<void>;
}

/**
 * MCP Client 连接池
 *
 * 目前使用 stdio 子进程方式连接 MCP Server（与 cc-switch / Codex 一致）。
 * 每个 MCP Server 对应一个子进程，通过 JSON-RPC over stdin/stdout 通信。
 * http/sse 类型的 MCP Server 暂未实现（需要 @modelcontextprotocol/sdk）。
 */
@Injectable()
export class McpClientService implements OnModuleDestroy {
  private readonly logger = new Logger(McpClientService.name);
  private readonly pool = new Map<string, PoolEntry>();

  /** 启动或复用 MCP Server 子进程 */
  private async getProcess(server: McpServerConfig): Promise<ChildProcessWithoutNullStreams> {
    const cached = this.pool.get(server.id);
    if (cached?.proc && !cached.proc.killed) return cached.proc;

    if (server.transport !== "stdio" || !server.command) {
      throw new Error(`暂不支持的 transport 类型: ${server.transport}`);
    }

    this.logger.log(`启动 MCP stdio 子进程: ${server.command} ${server.args.join(" ")}`);
    const proc = spawn(server.command, server.args, {
      env: { ...process.env, ...server.env },
      stdio: ["pipe", "pipe", "pipe"]
    });

    proc.stderr?.on("data", (data: Buffer) => {
      this.logger.debug(`[MCP ${server.id}] stderr: ${data.toString().trim()}`);
    });
    proc.on("exit", code => {
      this.logger.warn(`[MCP ${server.id}] 子进程退出，code=${code}`);
      this.pool.delete(server.id);
    });

    this.pool.set(server.id, { proc, connected: false });
    return proc;
  }

  private async ensureInitialized(server: McpServerConfig): Promise<ChildProcessWithoutNullStreams> {
    const proc = await this.getProcess(server);
    const entry = this.pool.get(server.id)!;
    if (entry.connected) return proc;

    if (!entry.initializing) {
      entry.initializing = (async () => {
        await this.sendRequest(
          proc,
          server.id,
          "initialize",
          {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "ai-platform", version: "1.0.0" }
          },
          server.timeout
        );
        this.sendNotification(proc, "notifications/initialized", {});
        entry.connected = true;
      })().finally(() => {
        entry.initializing = undefined;
      });
    }
    await entry.initializing;
    return proc;
  }

  /**
   * 列出工具：向 MCP Server 发 JSON-RPC initialize + tools/list
   */
  async listTools(server: McpServerConfig): Promise<McpTool[]> {
    const proc = await this.ensureInitialized(server);
    const result = await this.sendRequest(proc, server.id, "tools/list", {}, server.timeout);
    return (result.tools ?? []) as McpTool[];
  }

  /** 调用工具 */
  async callTool(server: McpServerConfig, toolName: string, args: Record<string, unknown>) {
    const proc = await this.ensureInitialized(server);
    const result = await this.sendRequest(
      proc,
      server.id,
      "tools/call",
      {
        name: toolName,
        arguments: args
      },
      server.timeout
    );
    return result;
  }

  /** 测试连接 */
  async testConnection(server: McpServerConfig): Promise<{ success: boolean; tools?: McpTool[]; error?: string }> {
    try {
      const tools = await this.listTools(server);
      return { success: true, tools };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** 销毁连接池 */
  async onModuleDestroy() {
    for (const [id, entry] of this.pool) {
      if (entry.proc && !entry.proc.killed) {
        entry.proc.kill("SIGTERM");
      }
    }
    this.pool.clear();
  }

  // ─── JSON-RPC 通信层 ──────────────────────

  private requestMap = new Map<
    string,
    { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }
  >();
  private msgId = 0;
  private bufferMap = new Map<string, string>();

  private async sendRequest(
    proc: ChildProcessWithoutNullStreams,
    serverId: string,
    method: string,
    params: unknown,
    timeout: number
  ): Promise<any> {
    const id = `mcp-${serverId}-${++this.msgId}`;
    const message = JSON.stringify({ jsonrpc: "2.0", id, method, params });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.requestMap.delete(id);
        reject(new Error(`MCP 请求超时: ${method} (${serverId})`));
      }, timeout);

      this.requestMap.set(id, { resolve, reject, timer });

      // 设置 stdout 消息处理器（一次性监听）
      this.setupStdoutHandler(proc, serverId);

      proc.stdin?.write(message + "\n");
    });
  }

  private sendNotification(proc: ChildProcessWithoutNullStreams, method: string, params: unknown) {
    const message = JSON.stringify({ jsonrpc: "2.0", method, params });
    proc.stdin?.write(message + "\n");
  }

  private stdoutHandlers = new Set<string>();

  private setupStdoutHandler(proc: ChildProcessWithoutNullStreams, serverId: string) {
    if (this.stdoutHandlers.has(serverId)) return;
    this.stdoutHandlers.add(serverId);

    proc.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString();
      const prev = this.bufferMap.get(serverId) ?? "";
      const full = prev + chunk;
      const lines = full.split("\n");

      // 最后一段可能不完整，保留到 buffer
      this.bufferMap.set(serverId, lines.pop() ?? "");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const msg = JSON.parse(trimmed);
          if (msg.id && this.requestMap.has(msg.id)) {
            const pending = this.requestMap.get(msg.id)!;
            this.requestMap.delete(msg.id);
            clearTimeout(pending.timer);
            if (msg.error) {
              pending.reject(new Error(msg.error.message ?? "MCP 错误"));
            } else {
              pending.resolve(msg.result);
            }
          }
        } catch {
          // 非 JSON 行（日志输出），忽略
        }
      }
    });
  }
}
