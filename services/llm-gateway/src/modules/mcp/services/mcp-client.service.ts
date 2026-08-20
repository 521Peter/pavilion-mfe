import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

export interface McpTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

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
    client: Client;
    transport: Transport;
    inFlight: number;
    idleTimer: NodeJS.Timeout;
}

const MAX_CONCURRENCY_PER_SERVER = 10;
const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class McpClientService implements OnModuleDestroy {
    private readonly logger = new Logger(McpClientService.name);
    private readonly pool = new Map<string, PoolEntry>();

    async listTools(server: McpServerConfig): Promise<McpTool[]> {
        return this.withClient(server, async (client) => {
            const result = await client.listTools(undefined, { timeout: server.timeout });
            return result.tools.map((tool) => ({
                name: tool.name,
                description: tool.description ?? '',
                inputSchema: tool.inputSchema as Record<string, unknown>
            }));
        });
    }

    async callTool(server: McpServerConfig, toolName: string, args: Record<string, unknown>) {
        return this.withClient(server, (client) =>
            client.callTool({ name: toolName, arguments: args }, undefined, { timeout: server.timeout })
        );
    }

    async testConnection(server: McpServerConfig): Promise<{ success: boolean; tools?: McpTool[]; error?: string }> {
        try {
            return { success: true, tools: await this.listTools(server) };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
        }
    }

    async onModuleDestroy(): Promise<void> {
        await Promise.all([...this.pool.keys()].map((id) => this.close(id)));
    }

    private async withClient<T>(server: McpServerConfig, operation: (client: Client) => Promise<T>): Promise<T> {
        const entry = await this.getClient(server);
        if (entry.inFlight >= MAX_CONCURRENCY_PER_SERVER) {
            throw new Error(`MCP Server 并发已达上限: ${server.id}`);
        }
        entry.inFlight++;
        this.touch(server.id, entry);
        try {
            return await operation(entry.client);
        } catch (error) {
            await this.close(server.id);
            throw error;
        } finally {
            entry.inFlight--;
        }
    }

    private async getClient(server: McpServerConfig): Promise<PoolEntry> {
        const cached = this.pool.get(server.id);
        if (cached) return cached;

        const transport = this.createTransport(server);
        const client = new Client({ name: 'pavilion-llm-gateway', version: '0.1.0' });
        await client.connect(transport, { timeout: server.timeout });
        const idleTimer = setTimeout(() => void this.close(server.id), IDLE_TIMEOUT_MS);
        idleTimer.unref();
        const entry = { client, transport, inFlight: 0, idleTimer };
        this.pool.set(server.id, entry);
        return entry;
    }

    private createTransport(server: McpServerConfig): Transport {
        if (server.transport === 'stdio' && server.command) {
            return new StdioClientTransport({
                command: server.command,
                args: server.args,
                env: server.env,
                stderr: 'pipe'
            });
        }
        if ((server.transport === 'http' || server.transport === 'streamable-http') && server.url) {
            return new StreamableHTTPClientTransport(new URL(server.url), {
                requestInit: { headers: server.headers }
            });
        }
        throw new Error(`不支持或配置不完整的 MCP transport: ${server.transport}`);
    }

    private touch(id: string, entry: PoolEntry): void {
        clearTimeout(entry.idleTimer);
        entry.idleTimer = setTimeout(() => void this.close(id), IDLE_TIMEOUT_MS);
        entry.idleTimer.unref();
    }

    private async close(id: string): Promise<void> {
        const entry = this.pool.get(id);
        if (!entry) return;
        this.pool.delete(id);
        clearTimeout(entry.idleTimer);
        try {
            await entry.client.close();
        } catch (error) {
            this.logger.warn(`关闭 MCP Client 失败 (${id}): ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
