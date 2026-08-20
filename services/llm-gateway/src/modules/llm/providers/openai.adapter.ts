import { ChatOpenAI } from '@langchain/openai';
import type { ProviderAdapterBuilder, ProviderConfig, ModelConfig } from '../interfaces/provider-adapter.interface';

/**
 * OpenAI Adapter Builder
 *
 * 将平台 Provider/Model 配置映射为 LangChain ChatOpenAI 构造参数。
 * 直连 OpenAI API 或任何 OpenAI 兼容端点（通过 baseUrl 自定义）。
 */
export class OpenAIAdapterBuilder implements ProviderAdapterBuilder {
    readonly type = 'openai';

    build(provider: ProviderConfig, model: ModelConfig) {
        const apiKey = provider.apiKey;
        if (!apiKey) {
            throw new Error('OpenAI provider requires apiKey');
        }

        const extra = provider.extra ?? {};

        return new ChatOpenAI({
            model: model.modelName,
            apiKey,
            configuration: {
                baseURL: provider.baseUrl ?? 'https://api.openai.com/v1',
                ...(extra as Record<string, never>)
            },
            temperature: model.temperature,
            maxTokens: typeof model.maxTokens === 'number' ? model.maxTokens : undefined
        });
    }
}
