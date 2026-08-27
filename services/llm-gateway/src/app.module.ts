import { Module } from "@nestjs/common";
import { AppController } from "~app.controller";
import { ScheduleModule } from "@nestjs/schedule";
import { ApiGatewayModule } from "@hodfords/api-gateway";
import { AuthenticationMiddleware } from "~middleware/authentication.middleware";
import { StaticRequestMiddleware } from "~middleware/static-request.middleware";
import { WsAuthenticationMiddleware } from "~middleware/ws-authentication.middleware";
import { McpAuthenticationMiddlewareImpl } from "~middleware/mcp-authentication.middleware";
import { env } from "~config/env.config";
import { PlatformModule } from "~platform.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PlatformModule,
    ApiGatewayModule.forRoot({
      apiServices: env.API_SERVICES,
      openApiSecurityKeys: ["auth-user-id"],
      openApiSecurityApiKeys: ["x-api-key"],
      excludeHeaders: ["auth-user-id", "auth-application-id", "permission-in-any-guard"],
      throttler: {
        globalIpRateLimit: 60,
        globalIpRateLimitTTL: 60,
        globalCustomRateLimit: 60,
        globalCustomRateLimitTTL: 60,
        isEnable: true,
        keyResolver: ({ request }) => {
          if (request.url === "/health") {
            return null;
          }
          const userId = "authUserId" in request ? request.authUserId : undefined;
          const requestIp = request.ip ?? request.socket.remoteAddress ?? "unknown";
          return typeof userId === "string" && userId.length > 0 ? `user:${userId}` : `ip:${requestIp}`;
        }
      },
      scalarOptions: {
        showExtensions: true
      },
      restful: { isEnableDocument: true, hideDocumentIds: ["AppController_getHello", "AppController_getHealth"] },
      redis: {
        host: env.REDIS.HOST,
        port: env.REDIS.PORT,
        db: env.REDIS.DB,
        username: env.REDIS.USERNAME,
        password: env.REDIS.PASSWORD,
        tls: env.REDIS.TLS
      },
      pool: {
        connections: 100,
        pipelining: 1
      },
      mcp: {
        enabled: true
      }
    })
  ],
  controllers: [AppController],
  providers: [
    AuthenticationMiddleware,
    StaticRequestMiddleware,
    WsAuthenticationMiddleware,
    McpAuthenticationMiddlewareImpl
  ]
})
export class AppModule {}
