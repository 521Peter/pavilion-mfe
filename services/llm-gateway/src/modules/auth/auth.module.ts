import { Module } from "@nestjs/common";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>("app.jwtSecret")!,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Nest JWT accepts jsonwebtoken duration strings, while its transitive ms template-literal type cannot represent runtime configuration
        signOptions: {
          expiresIn: config.get<string>("app.jwtExpiresIn") ?? "1d"
        } as JwtModuleOptions["signOptions"]
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
