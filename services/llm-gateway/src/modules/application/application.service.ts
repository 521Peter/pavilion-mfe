import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';

@Injectable()
export class ApplicationService {
    constructor(private readonly prisma: PrismaService) {}

    list() {
        return this.prisma.application.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                keys: {
                    select: { id: true, name: true, keyPrefix: true, isActive: true, expiresAt: true, lastUsedAt: true }
                }
            }
        });
    }

    create(dto: CreateApplicationDto) {
        return this.prisma.application.create({ data: { ...dto, allowedModels: dto.allowedModels ?? [] } });
    }

    async update(id: string, dto: UpdateApplicationDto) {
        const result = await this.prisma.application.updateMany({ where: { id }, data: dto });
        if (result.count === 0) throw new NotFoundException('Application 不存在');
        return this.prisma.application.findUniqueOrThrow({ where: { id } });
    }
}
