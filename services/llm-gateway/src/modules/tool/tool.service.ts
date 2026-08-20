import { Injectable } from '@nestjs/common';
import { Prisma } from '@/../generated/prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CreateToolDto } from './dto/tool.dto';

@Injectable()
export class ToolService {
    constructor(private readonly prisma: PrismaService) {}
    list() {
        return this.prisma.toolDefinition.findMany({ orderBy: { createdAt: 'asc' } });
    }

    create(dto: CreateToolDto) {
        return this.prisma.toolDefinition.create({
            data: {
                ...dto,
                inputSchema: dto.inputSchema as Prisma.InputJsonValue,
                config: (dto.config ?? {}) as Prisma.InputJsonValue,
                isActive: dto.isActive ?? true
            }
        });
    }

    delete(id: string) {
        return this.prisma.toolDefinition.delete({ where: { id } });
    }
}
