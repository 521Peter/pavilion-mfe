import { Injectable } from "@nestjs/common";
import { LlmProviderService } from "./llm-provider.service";
import { LlmAgentService } from "./llm-agent.service";

/** 聊天消息 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** 聊天请求参数 */
export interface ChatParams {
  providerId: string;
  modelId: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

/** 聊天响应 */
export interface ChatResult {
  content: string;
  model: string;
  providerType: string;
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
  constructor(
    private readonly providerService: LlmProviderService,
    private readonly agentService: LlmAgentService
  ) {}

  /** 非流式聊天 */
  async chat(params: ChatParams): Promise<ChatResult> {
    const model = await this.providerService.getModel(params.providerId, params.modelId);
    const content = await this.agentService.run(model, params);

    return {
      content,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: (model as any).model ?? "",
      providerType: model.lc_namespace?.join("/") ?? ""
    };
  }

  /**
   * 流式聊天
   * 返回 AsyncGenerator<string>，每个 yield 是一个文本 chunk。
   * Controller 层可经 SSE 或 Socket.IO 推送给前端。
   */
  async *stream(params: ChatParams): AsyncGenerator<string> {
    const model = await this.providerService.getModel(params.providerId, params.modelId);
    yield* this.agentService.stream(model, params);
  }
}
