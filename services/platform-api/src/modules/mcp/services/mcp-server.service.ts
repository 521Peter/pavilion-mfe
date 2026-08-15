import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@/../generated/prisma/client";
import { PrismaService } from "@/database/prisma.service";

/**
 * MCP Server CRUD Service
 *
 * 负责 MCP Server 的数据库增删改查，以及工具缓存同步。
 */
@Injectable()
export class McpServerService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.mcpServer.findMany({
      orderBy: { createdAt: "asc" }
    });
  }

  async getById(id: string) {
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
    return this.prisma.mcpServer.create({
      data: {
        name: data.name,
        identifier: data.identifier,
        description: data.description,
        icon: data.icon,
        transport: data.transport,
        command: data.command,
        args: data.args ?? [],
        env: (data.env ?? {}) as Prisma.InputJsonValue,
        url: data.url,
        headers: (data.headers ?? {}) as Prisma.InputJsonValue,
        timeout: data.timeout ?? 60000,
        isActive: data.isActive ?? true
      }
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.env !== undefined) {
      updateData.env = data.env as Prisma.InputJsonValue;
    }
    if (data.headers !== undefined) {
      updateData.headers = data.headers as Prisma.InputJsonValue;
    }
    return this.prisma.mcpServer.update({
      where: { id },
      data: updateData as Prisma.McpServerUpdateInput
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
        cachedTools: tools as Prisma.InputJsonValue,
        lastSyncAt: new Date()
      }
    });
  }
}
