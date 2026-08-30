import { Module } from "@nestjs/common";
import { LlmChatController } from "./controllers/llm-chat.controller";
import { ChatThreadService } from "./services/chat-thread.service";

@Module({
  controllers: [LlmChatController],
  providers: [ChatThreadService]
})
export class LlmModule {}
