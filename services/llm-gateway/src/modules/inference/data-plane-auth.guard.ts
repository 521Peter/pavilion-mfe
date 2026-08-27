import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "@/database/prisma.service";
import { ApplicationKeyService } from "@/modules/application/application-key.service";
import type { InferencePrincipal } from "./inference.types";

export type DataPlaneRequest = Request & { principal: InferencePrincipal };

@Injectable()
export class DataPlaneAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly applicationKeys: ApplicationKeyService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DataPlaneRequest>();
    const authorization = request.headers.authorization;
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
    const apiKeyHeader = request.headers["x-api-key"];
    const apiKey =
      (typeof apiKeyHeader === "string" ? apiKeyHeader : undefined) ??
      (bearer?.startsWith("pav_") ? bearer : undefined);
    if (apiKey) {
      const key = await this.applicationKeys.authenticate(apiKey);
      request.principal = {
        type: "application",
        applicationId: key.applicationId,
        allowedModels: key.application.allowedModels
      };
      return true;
    }
    if (!bearer) throw new UnauthorizedException("缺少 Bearer Token 或 Application Key");
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(bearer);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== "ACTIVE") throw new Error("inactive");
      request.principal = { type: "user", userId: user.id };
      return true;
    } catch {
      throw new UnauthorizedException("认证凭据无效");
    }
  }
}
