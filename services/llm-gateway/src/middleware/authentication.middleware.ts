import { IncomingMessage } from "http";
import type { RouterDetail } from "../../libs/api-gateway/restful/types/router-path.type";
import type { ProxyMiddlewareHandler } from "../../libs/api-gateway/restful/interfaces/proxy-middleware.interface";
import { ProxyMiddleware } from "../../libs/api-gateway/restful/decorators/proxy-middleware.decorator";
import type { ProxyRequest } from "../../libs/api-gateway/restful/models/proxy-request.model";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/database/prisma.service";
import { ApplicationKeyService } from "@/modules/application/application-key.service";

@Injectable()
@ProxyMiddleware()
export class AuthenticationMiddleware implements ProxyMiddlewareHandler {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly applicationKeys: ApplicationKeyService
  ) {}

  async handle(
    routerDetail: RouterDetail,
    request: IncomingMessage & { authApplicationId?: string; authUserId?: string },
    proxyRequest: ProxyRequest
  ): Promise<boolean> {
    const requiresBearer = routerDetail.isBearerAuth;
    const requiresApiKey = routerDetail.isApiKeyAuth;
    const requiresAuthentication = requiresBearer || requiresApiKey;
    const authorization = request.headers.authorization;
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
    const apiKey =
      typeof request.headers["x-api-key"] === "string"
        ? request.headers["x-api-key"]
        : bearer?.startsWith("pav_")
          ? bearer
          : undefined;
    try {
      if (apiKey) {
        if (requiresAuthentication && !requiresApiKey) return false;
        const key = await this.applicationKeys.authenticate(apiKey);
        proxyRequest.addHeaders({ authApplicationId: key.applicationId });
        request.authApplicationId = key.applicationId;
      } else if (bearer) {
        if (requiresAuthentication && !requiresBearer) return false;
        const payload = await this.jwt.verifyAsync<{ sub: string }>(bearer);
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || user.status !== "ACTIVE") return false;
        proxyRequest.addHeaders({ authUserId: user.id });
        request.authUserId = user.id;
      } else if (requiresAuthentication) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
