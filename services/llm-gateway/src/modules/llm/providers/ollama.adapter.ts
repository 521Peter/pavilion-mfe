import { ChatOllama } from '@langchain/ollama';
import type { ProviderAdapterBuilder, ProviderConfig, ModelConfig } from '../interfaces/provider-adapter.interface';

/**
 * Ollama 适配器构建器
 *
 * 将平台 Provider/Model 配置映射为 LangChain ChatOllama 构造参数。
 * 连接本地 Ollama 服务（默认 http://localhost:11434）。
 */
export class OllamaAdapterBuilder implements ProviderAdapterBuilder {
    readonly type = 'ollama';

    build(_provider: ProviderConfig, model: ModelConfig) {
        return new ChatOllama({
            model: model.modelName,
            baseUrl: _provider.baseUrl ?? 'http://localhost:11434',
            temperature: model.temperature,
            numPredict: typeof model.maxTokens === 'number' ? model.maxTokens : undefined
        });
    }
}
