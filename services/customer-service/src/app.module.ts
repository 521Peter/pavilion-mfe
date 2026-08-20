import { Module } from "@nestjs/common";
import { SupportController } from "./support/support.controller";
import { SupportService } from "./support/support.service";
import { GatewayIdentityGuard } from "./support/gateway-identity.guard";

@Module({
  controllers: [SupportController],
  providers: [SupportService, GatewayIdentityGuard]
})
export class AppModule {}
