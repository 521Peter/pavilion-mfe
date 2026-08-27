import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { toPrismaJson } from "@/database/prisma-json";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    actorUserId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    requestId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: { ...input, metadata: toPrismaJson(input.metadata ?? {}) }
    });
  }
}
