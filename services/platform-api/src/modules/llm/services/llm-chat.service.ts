import { Injectable } from '@nestjs/common'
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
  type BaseMessage,
} from '@langchain/core/messages'
import { LlmProviderService } from './llm-provider.service'

/** 聊天消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** 聊天请求参数 */
export interface ChatParams {
  providerId: string
  modelId: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
}

/** 聊天响应 */
export interface ChatResult {
  content: string
  model: string
  providerType: string
}

function toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((m) => {
    switch (m.role) {
      case 'system':
        return new SystemMessage(m.content)
      case 'assistant':
        return new AIMessage(m.content)
      default:
        return new HumanMessage(m.content)
    }
  })
}

/** 请求级可选参数 */
function buildInvokeParams(params: ChatParams): Record<string, unknown> {
  const invokeParams: Record<string, unknown> = {}
  if (params.temperature !== undefined) invokeParams.temperature = params.temperature
  if (params.maxTokens !== undefined) invokeParams.maxTokens = params.maxTokens
  return invokeParams
}

/**
 * LLM Chat Service
 *
 * 平台统一的 LLM 调用入口：
 *   - chat()        非流式调用，返回完整结果
 *   - stream()      流式调用，返回 AsyncGenerator<string>
 *
 * 上层 Agent 编排（LangGraph）也直接调用本 Service 获取模型实例或调用结果。
 */
@Injectable()
export class LlmChatService {
  constructor(private readonly providerService: LlmProviderService) {}

  /** 非流式聊天 */
  async chat(params: ChatParams): Promise<ChatResult> {
    const model = await this.providerService.getModel(
      params.providerId,
      params.modelId,
    )

    const messages = toLangChainMessages(params.messages)
    const response = await model.invoke(messages, buildInvokeParams(params))

    return {
      content: typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: (model as any).model ?? '',
      providerType: model.lc_namespace?.join('/') ?? '',
    }
  }

  /**
   * 流式聊天
   * 返回 AsyncGenerator<string>，每个 yield 是一个文本 chunk。
   * Controller 层可经 SSE 或 Socket.IO 推送给前端。
   */
  async *stream(params: ChatParams): AsyncGenerator<string> {
    const model = await this.providerService.getModel(
      params.providerId,
      params.modelId,
    )

    const messages = toLangChainMessages(params.messages)
    const stream = await model.stream(messages, buildInvokeParams(params))

    for await (const chunk of stream) {
      const text = typeof chunk.content === 'string' ? chunk.content : ''
      if (text) yield text
    }
  }
}
