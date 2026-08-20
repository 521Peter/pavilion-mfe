import { Injectable } from '@nestjs/common';
import { Prisma } from '@/../generated/prisma/client';
import { PrismaService } from '@/database/prisma.service';

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
            data: { ...input, metadata: (input.metadata ?? {}) as Prisma.InputJsonValue }
        });
    }
}
