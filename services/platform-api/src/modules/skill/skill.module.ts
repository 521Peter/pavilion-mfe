import { Module } from "@nestjs/common";
import { SkillService } from "./services/skill.service";
import { SkillLoaderService } from "./services/skill-loader.service";
import { SkillController } from "./controllers/skill.controller";

@Module({
  controllers: [SkillController],
  providers: [SkillService, SkillLoaderService],
  exports: [SkillService, SkillLoaderService]
})
export class SkillModule {}
