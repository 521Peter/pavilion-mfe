import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { toPrismaJson } from "@/database/prisma-json";
import { CreateToolDto } from "./dto/tool.dto";

@Injectable()
export class ToolService {
  constructor(private readonly prisma: PrismaService) {}
  list() {
    return this.prisma.toolDefinition.findMany({ orderBy: { createdAt: "asc" } });
  }

  create(dto: CreateToolDto) {
    return this.prisma.toolDefinition.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        inputSchema: toPrismaJson(dto.inputSchema),
        config: toPrismaJson(dto.config ?? {}),
        mcpServerId: dto.mcpServerId,
        isActive: dto.isActive ?? true
      }
    });
  }

  delete(id: string) {
    return this.prisma.toolDefinition.delete({ where: { id } });
  }
}
