import { IncomingMessage } from 'http';
import { RouterDetail, ProxyMiddlewareHandler, ProxyMiddleware, ProxyRequest } from '@hodfords/api-gateway';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/database/prisma.service';
import { ApplicationKeyService } from '@/modules/application/application-key.service';

@Injectable()
@ProxyMiddleware()
export class AuthenticationMiddleware implements ProxyMiddlewareHandler {
    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
        private readonly applicationKeys: ApplicationKeyService
    ) {}

    async handle(routerDetail: RouterDetail, request: IncomingMessage, proxyRequest: ProxyRequest): Promise<boolean> {
        const authorization = request.headers.authorization;
        const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined;
        const apiKey =
            typeof request.headers['x-api-key'] === 'string'
                ? request.headers['x-api-key']
                : bearer?.startsWith('pav_')
                  ? bearer
                  : undefined;
        try {
            if (apiKey) {
                const key = await this.applicationKeys.authenticate(apiKey);
                proxyRequest.addHeaders({ authApplicationId: key.applicationId });
                (request as any).authApplicationId = key.applicationId;
            } else if (bearer) {
                const payload = await this.jwt.verifyAsync<{ sub: string }>(bearer);
                const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
                if (!user || user.status !== 'ACTIVE') return false;
                proxyRequest.addHeaders({ authUserId: user.id });
                (request as any).authUserId = user.id;
            }
            return true;
        } catch {
            return false;
        }
    }
}
