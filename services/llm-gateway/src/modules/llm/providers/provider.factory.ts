import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ProviderConfig, ModelConfig } from '../interfaces/provider-adapter.interface';
import { getProviderBuilder, getSupportedProviderTypes } from './provider.registry';

/**
 * Provider 工厂（Factory 模式）
 *
 * 根据 DB 中的 providerType 查 Registry 找到对应 Builder，
 * 由 Builder 构建 LangChain BaseChatModel 实例。
 */
export class ProviderFactory {
    /** 构建一个 LangChain ChatModel 实例 */
    static create(provider: ProviderConfig, model: ModelConfig): BaseChatModel {
        const builder = getProviderBuilder(provider.type);
        return builder.build(provider, model);
    }

    /** 获取已注册的供应商类型列表 */
    static getSupportedTypes(): string[] {
        return getSupportedProviderTypes();
    }
}
