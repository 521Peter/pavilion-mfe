import { BadRequestException, CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
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
        authenticationType: "application",
        applicationId: key.applicationId,
        allowedModels: key.application.allowedModels
      };
      return true;
    }

    if (!bearer) throw new BadRequestException("缺少或无效的 Bearer Token");
    const appCodeHeader = request.headers["x-pavilion-app-code"];
    if (
      typeof appCodeHeader !== "string" ||
      appCodeHeader.length > 64 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(appCodeHeader)
    ) {
      throw new BadRequestException("缺少或无效的 X-Pavilion-App-Code");
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(bearer);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status !== "ACTIVE") throw new Error("inactive");
      const application = await this.prisma.application.findUnique({ where: { code: appCodeHeader } });
      if (!application?.isActive) throw new BadRequestException("来源应用不存在或已停用");
      request.principal = {
        authenticationType: "user",
        userId: user.id,
        applicationId: application.id
      };
      return true;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("认证凭据无效");
    }
  }
}
