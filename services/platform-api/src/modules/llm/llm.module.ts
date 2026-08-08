import { Module } from '@nestjs/common'
import { LlmProviderService } from './services/llm-provider.service'
import { LlmChatService } from './services/llm-chat.service'
import { LlmProviderController } from './controllers/llm-provider.controller'
import { LlmChatController } from './controllers/llm-chat.controller'

@Module({
  controllers: [LlmProviderController, LlmChatController],
  providers: [LlmProviderService, LlmChatService],
  exports: [LlmProviderService, LlmChatService],
})
export class LlmModule {}
