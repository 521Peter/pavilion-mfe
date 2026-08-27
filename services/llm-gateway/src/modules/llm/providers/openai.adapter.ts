import { ChatOpenAI } from "@langchain/openai";
import type { ProviderAdapterBuilder, ProviderConfig, ModelConfig } from "../interfaces/provider-adapter.interface";

/**
 * OpenAI 适配器构建器
 *
 * 将平台 Provider/Model 配置映射为 LangChain ChatOpenAI 构造参数。
 * 直连 OpenAI API 或任何 OpenAI 兼容端点（通过 baseUrl 自定义）。
 */
export class OpenAIAdapterBuilder implements ProviderAdapterBuilder {
  readonly type = "openai";

  build(provider: ProviderConfig, model: ModelConfig) {
    const apiKey = provider.apiKey;
    if (!apiKey) {
      throw new Error("OpenAI provider requires apiKey");
    }

    const extra = provider.extra ?? {};

    return new ChatOpenAI({
      model: model.modelName,
      apiKey,
      configuration: {
        baseURL: provider.baseUrl ?? "https://api.openai.com/v1",
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- provider.extra is the persisted pass-through OpenAI client configuration validated as a JSON object before adapter construction
        ...(extra as Record<string, never>)
      },
      temperature: model.temperature,
      maxTokens: typeof model.maxTokens === "number" ? model.maxTokens : undefined
    });
  }
}
