import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { UrlSafetyService } from "@/common/security/url-safety.service";
import { toPrismaJson } from "@/database/prisma-json";

/**
 * MCP 服务器增删改查服务
 *
 * 负责 MCP Server 的数据库增删改查，以及工具缓存同步。
 */
@Injectable()
export class McpServerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly urlSafety: UrlSafetyService
  ) {}

  async list() {
    const servers = await this.listRuntime();
    return servers.map(server =>
      Object.assign({}, server, {
        env: this.maskRecord(server.env),
        headers: this.maskRecord(server.headers)
      })
    );
  }

  listRuntime() {
    return this.prisma.mcpServer.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  async getById(id: string) {
    const server = await this.prisma.mcpServer.findUnique({ where: { id } });
    if (!server) throw new NotFoundException("MCP Server 不存在");
    return { ...server, env: this.maskRecord(server.env), headers: this.maskRecord(server.headers) };
  }

  async getRuntimeById(id: string) {
    const server = await this.prisma.mcpServer.findUnique({ where: { id } });
    if (!server) throw new NotFoundException("MCP Server 不存在");
    return server;
  }

  async create(data: {
    name: string;
    identifier: string;
    description?: string;
    icon?: string;
    transport: string;
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
    headers?: Record<string, string>;
    timeout?: number;
    isActive?: boolean;
  }) {
    if (data.transport !== "stdio") await this.urlSafety.assertSafe(data.url);
    return this.prisma.mcpServer.create({
      data: {
        name: data.name,
        identifier: data.identifier,
        description: data.description,
        icon: data.icon,
        transport: data.transport,
        command: data.command,
        args: data.args ?? [],
        env: data.env ?? {},
        url: data.url,
        headers: data.headers ?? {},
        timeout: data.timeout ?? 60000,
        isActive: data.isActive ?? true
      }
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    if (typeof data.url === "string") await this.urlSafety.assertSafe(data.url);
    const updateData: Record<string, unknown> = { ...data };
    if (data.env !== undefined) {
      updateData.env = data.env;
    }
    if (data.headers !== undefined) {
      updateData.headers = data.headers;
    }
    return this.prisma.mcpServer.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id: string) {
    await this.prisma.mcpServer.delete({ where: { id } });
  }

  /** 同步工具列表快照到 cachedTools */
  async syncTools(id: string, tools: unknown[]) {
    return this.prisma.mcpServer.update({
      where: { id },
      data: {
        cachedTools: toPrismaJson(tools),
        lastSyncAt: new Date()
      }
    });
  }

  private maskRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(Object.keys(value).map(key => [key, "********"]));
  }
}
