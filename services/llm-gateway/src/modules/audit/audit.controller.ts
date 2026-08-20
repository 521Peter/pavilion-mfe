import { Controller, Get, Query } from '@nestjs/common';
import { PlatformApi } from '@/common/decorators/platform-api.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { PrismaService } from '@/database/prisma.service';

@PlatformApi()
@Roles('ADMIN')
@Controller('api/audit')
export class AuditController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    list(@Query('take') take?: string) {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: Math.min(Math.max(Number(take) || 50, 1), 200)
        });
    }
}
