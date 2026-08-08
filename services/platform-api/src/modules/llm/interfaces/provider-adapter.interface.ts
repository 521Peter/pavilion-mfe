import type { BaseChatModel } from '@langchain/core/language_models/chat_models'

/** 从 DB 读取的 Provider 配置，已平面化为构造参数映射 */
export interface ProviderConfig {
  /** 提供商类型标识，如 "openai" / "ollama" */
  type: string
  /** API 地址 */
  baseUrl?: string
  /** API Key */
  apiKey?: string
  /** 扩展配置（headers、timeout、自定义参数等） */
  extra?: Record<string, unknown>
}

/** 从 DB 读取的模型级配置 */
export interface ModelConfig {
  /** 模型标识，如 "gpt-4o" */
  modelName: string
  /** 模型级默认参数 */
  temperature?: number
  maxTokens?: number
  /** 其他参数 */
  [key: string]: unknown
}

/** Adapter Builder 负责把平台配置转化为 LangChain ChatModel 实例 */
export interface ProviderAdapterBuilder {
  /** 该 Builder 处理的 provider type 标识 */
  readonly type: string

  /**
   * 构建 LangChain BaseChatModel 实例
   * @param provider Provider 级配置
   * @param model 模型级配置（含 modelName）
   * @returns BaseChatModel 实例
   */
  build(provider: ProviderConfig, model: ModelConfig): BaseChatModel
}
