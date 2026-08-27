import { Request, Response } from "express";
import { McpAuthenticationMiddleware, McpAuthenticationMiddlewareHandler } from "@hodfords/api-gateway";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@/database/prisma.service";
import { ApplicationKeyService } from "@/modules/application/application-key.service";

@Injectable()
@McpAuthenticationMiddleware()
export class McpAuthenticationMiddlewareImpl implements McpAuthenticationMiddlewareHandler {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly applicationKeys: ApplicationKeyService
  ) {}

  async authenticate(request: Request, response: Response): Promise<boolean> {
    const authorization = request.headers.authorization;
    const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
    const headerKey = request.headers["x-api-key"];
    const apiKey =
      (typeof headerKey === "string" ? headerKey : undefined) ?? (bearer?.startsWith("pav_") ? bearer : undefined);
    try {
      if (apiKey) {
        await this.applicationKeys.authenticate(apiKey);
        return true;
      }
      if (!bearer) return false;
      const payload = await this.jwt.verifyAsync<{ sub: string }>(bearer);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      return user?.status === "ACTIVE";
    } catch {
      response.status(401);
      return false;
    }
  }
}
