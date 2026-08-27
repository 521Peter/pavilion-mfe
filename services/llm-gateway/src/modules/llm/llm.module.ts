import { Module } from "@nestjs/common";
import { LlmChatService } from "./services/llm-chat.service";
import { LlmChatController } from "./controllers/llm-chat.controller";
import { ChatThreadService } from "./services/chat-thread.service";
import { SkillModule } from "@/modules/skill/skill.module";
import { McpModule } from "@/modules/mcp/mcp.module";
import { ProviderModule } from "@/modules/provider/provider.module";
import { AgentModule } from "@/modules/agent/agent.module";

@Module({
  imports: [SkillModule, McpModule, ProviderModule, AgentModule],
  controllers: [LlmChatController],
  providers: [LlmChatService, ChatThreadService],
  exports: [LlmChatService]
})
export class LlmModule {}
