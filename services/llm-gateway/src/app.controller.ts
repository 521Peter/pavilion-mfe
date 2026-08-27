import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { OpenApiService } from "@hodfords/api-gateway";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "@/database/prisma.service";
import { REDIS_OPTION } from "@hodfords/api-gateway";
import type Redis from "ioredis";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(
    private openApiService: OpenApiService,
    private prisma: PrismaService,
    @Inject(REDIS_OPTION) private redis: Redis
  ) {}

  @Get("health/live")
  liveness(): { status: string } {
    return { status: "ok" };
  }

  @Get("health/ready")
  async readiness(): Promise<{ status: string }> {
    try {
      await Promise.all([this.prisma.$queryRaw`SELECT 1`, this.redis.ping(), this.openApiService.ready]);
      return { status: "ready" };
    } catch {
      throw new ServiceUnavailableException("Gateway dependencies are not ready");
    }
  }
}
