import { Module } from "@nestjs/common";
import { LlmProviderService } from "./services/llm-provider.service";
import { LlmChatService } from "./services/llm-chat.service";
import { LlmProviderController } from "./controllers/llm-provider.controller";
import { LlmChatController } from "./controllers/llm-chat.controller";
import { ChatThreadService } from "./services/chat-thread.service";
import { SkillModule } from "@/modules/skill/skill.module";
import { McpModule } from "@/modules/mcp/mcp.module";
import { SkillSelectorService } from "./services/skill-selector.service";
import { AgentToolService } from "./services/agent-tool.service";
import { LlmAgentService } from "./services/llm-agent.service";

@Module({
  imports: [SkillModule, McpModule],
  controllers: [LlmProviderController, LlmChatController],
  providers: [
    LlmProviderService,
    LlmChatService,
    ChatThreadService,
    SkillSelectorService,
    AgentToolService,
    LlmAgentService
  ],
  exports: [LlmProviderService, LlmChatService]
})
export class LlmModule {}
