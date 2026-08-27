import { Module } from "@nestjs/common";
import { InferenceModule } from "@/modules/inference/inference.module";
import { McpModule } from "@/modules/mcp/mcp.module";
import { SkillModule } from "@/modules/skill/skill.module";
import { AuthModule } from "@/modules/auth/auth.module";
import { ApplicationModule } from "@/modules/application/application.module";
import { AgentToolService } from "@/modules/llm/services/agent-tool.service";
import { LlmAgentService } from "@/modules/llm/services/llm-agent.service";
import { SkillSelectorService } from "@/modules/llm/services/skill-selector.service";
import { AgentAdminController } from "./agent-admin.controller";
import { AgentRunController } from "./agent-run.controller";
import { AgentConfigService } from "./agent-config.service";
import { AgentRunService } from "./agent-run.service";

@Module({
  imports: [InferenceModule, AuthModule, ApplicationModule, McpModule, SkillModule],
  controllers: [AgentAdminController, AgentRunController],
  providers: [AgentConfigService, AgentRunService, AgentToolService, SkillSelectorService, LlmAgentService],
  exports: [LlmAgentService]
})
export class AgentModule {}
