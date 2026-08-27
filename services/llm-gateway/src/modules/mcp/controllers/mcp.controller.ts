import { Controller, Get, Post, Put, Delete, Body, Param } from "@nestjs/common";
import { McpServerService } from "../services/mcp-server.service";
import { McpClientService } from "../services/mcp-client.service";
import type { McpServerConfig } from "../services/mcp-client.service";
import { CreateMcpServerDto, UpdateMcpServerDto } from "../dto/mcp-server.dto";
import { Roles } from "@/common/decorators/roles.decorator";
import { PlatformApi } from "@/common/decorators/platform-api.decorator";

type RuntimeMcpServer = Awaited<ReturnType<McpServerService["getRuntimeById"]>>;

function stringRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function toConfig(server: RuntimeMcpServer): McpServerConfig {
  return {
    id: server.id,
    transport: server.transport,
    command: server.command,
    args: server.args ?? [],
    env: stringRecord(server.env),
    url: server.url,
    headers: stringRecord(server.headers),
    timeout: server.timeout ?? 60000
  };
}

@PlatformApi()
@Controller("api/mcp")
export class McpController {
  constructor(
    private readonly serverService: McpServerService,
    private readonly clientService: McpClientService
  ) {}

  // ── Server CRUD（读不限角色，写限 ADMIN）──

  @Get("servers")
  listServers() {
    return this.serverService.list();
  }

  @Get("servers/:id")
  getServer(@Param("id") id: string) {
    return this.serverService.getById(id);
  }

  @Post("servers")
  @Roles("ADMIN")
  createServer(@Body() dto: CreateMcpServerDto) {
    return this.serverService.create(dto);
  }

  @Put("servers/:id")
  @Roles("ADMIN")
  updateServer(@Param("id") id: string, @Body() dto: UpdateMcpServerDto) {
    return this.serverService.update(id, Object.fromEntries(Object.entries(dto)));
  }

  @Delete("servers/:id")
  @Roles("ADMIN")
  async deleteServer(@Param("id") id: string) {
    await this.serverService.delete(id);
    return { success: true };
  }

  // ── 工具操作 ──

  /** 测试连接并返回工具列表 */
  @Post("servers/:id/test")
  @Roles("ADMIN")
  async testConnection(@Param("id") id: string) {
    const server = await this.serverService.getRuntimeById(id);
    return this.clientService.testConnection(toConfig(server));
  }

  /** 获取缓存的工具列表（不发请求） */
  @Get("servers/:id/tools")
  async getCachedTools(@Param("id") id: string) {
    const server = await this.serverService.getRuntimeById(id);
    return server.cachedTools;
  }

  /** 同步：连接 MCP Server 获取工具列表并写入 cachedTools */
  @Post("servers/:id/sync")
  @Roles("ADMIN")
  async syncTools(@Param("id") id: string) {
    const server = await this.serverService.getRuntimeById(id);
    const result = await this.clientService.testConnection(toConfig(server));
    if (result.success && result.tools) {
      await this.serverService.syncTools(id, result.tools);
      return { success: true, tools: result.tools };
    }
    return { success: false, error: result.error };
  }

  /** 直接调用工具（调试用） */
  @Post("servers/:id/invoke")
  @Roles("ADMIN")
  async invokeTool(@Param("id") id: string, @Body() body: { toolName: string; args?: Record<string, unknown> }) {
    const server = await this.serverService.getRuntimeById(id);
    return this.clientService.callTool(toConfig(server), body.toolName, body.args ?? {});
  }
}
