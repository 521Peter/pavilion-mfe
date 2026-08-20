import { IncomingMessage } from 'http';
import { ProxyRequest, WsProxyMiddleware, WsProxyMiddlewareHandler } from '@hodfords/api-gateway';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/database/prisma.service';
import { ApplicationKeyService } from '@/modules/application/application-key.service';

@Injectable()
@WsProxyMiddleware()
export class WsAuthenticationMiddleware implements WsProxyMiddlewareHandler {
    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
        private readonly applicationKeys: ApplicationKeyService
    ) {}

    async handle(request: IncomingMessage, proxyRequest: ProxyRequest): Promise<boolean> {
        const authorization = request.headers.authorization;
        const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
        const headerKey = request.headers['x-api-key'];
        const apiKey =
            (typeof headerKey === 'string' ? headerKey : undefined) ??
            (bearer?.startsWith('pav_') ? bearer : undefined);
        try {
            if (apiKey) {
                const key = await this.applicationKeys.authenticate(apiKey);
                proxyRequest.addHeaders({ authApplicationId: key.applicationId });
                return true;
            }
            if (!bearer) return true;
            const payload = await this.jwt.verifyAsync<{ sub: string }>(bearer);
            const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
            if (!user || user.status !== 'ACTIVE') return false;
            proxyRequest.addHeaders({ authUserId: user.id });
            return true;
        } catch {
            return false;
        }
    }
}
