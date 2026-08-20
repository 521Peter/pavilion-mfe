import { Module } from '@nestjs/common';
import { LlmProviderController } from '@/modules/llm/controllers/llm-provider.controller';
import { LlmProviderService } from '@/modules/llm/services/llm-provider.service';

@Module({
    controllers: [LlmProviderController],
    providers: [LlmProviderService],
    exports: [LlmProviderService]
})
export class ProviderModule {}
