import { Module } from "@nestjs/common";
import { ApplicationController } from "./application.controller";
import { ApplicationKeyService } from "./application-key.service";
import { ApplicationService } from "./application.service";

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationKeyService],
  exports: [ApplicationKeyService]
})
export class ApplicationModule {}
