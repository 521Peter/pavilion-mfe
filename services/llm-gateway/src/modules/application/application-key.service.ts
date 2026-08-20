import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ApplicationKeyService {
    private readonly pepper: string;

    constructor(
        private readonly prisma: PrismaService,
        config: ConfigService
    ) {
        this.pepper = config.get<string>('app.applicationKeyPepper')!;
    }

    private hash(key: string): string {
        return createHmac('sha256', this.pepper).update(key).digest('hex');
    }

    async create(applicationId: string, name: string, expiresAt?: string) {
        const application = await this.prisma.application.findUnique({ where: { id: applicationId } });
        if (!application) throw new NotFoundException('Application 不存在');
        const secret = `pav_${randomBytes(32).toString('base64url')}`;
        const key = await this.prisma.applicationKey.create({
            data: {
                applicationId,
                name,
                keyPrefix: secret.slice(0, 12),
                keyHash: this.hash(secret),
                expiresAt: expiresAt ? new Date(expiresAt) : undefined
            }
        });
        return { ...key, key: secret, keyHash: undefined };
    }

    async authenticate(secret: string) {
        const key = await this.prisma.applicationKey.findUnique({
            where: { keyHash: this.hash(secret) },
            include: { application: true }
        });
        if (
            !key ||
            !key.isActive ||
            !key.application.isActive ||
            (key.expiresAt !== null && key.expiresAt <= new Date())
        ) {
            throw new UnauthorizedException('Application Key 无效或已过期');
        }
        await this.prisma.applicationKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
        return key;
    }

    async revoke(applicationId: string, keyId: string): Promise<void> {
        const result = await this.prisma.applicationKey.updateMany({
            where: { id: keyId, applicationId },
            data: { isActive: false }
        });
        if (result.count === 0) throw new NotFoundException('Application Key 不存在');
    }
}
