import { Controller, Post, Body, Sse, MessageEvent } from '@nestjs/common'
import { Observable } from 'rxjs'
import { LlmChatService } from '../services/llm-chat.service'
import { ChatDto } from '../dto/chat.dto'

@Controller('llm')
export class LlmChatController {
  constructor(private readonly chatService: LlmChatService) {}

  /** 非流式聊天 */
  @Post('chat')
  async chat(@Body() dto: ChatDto) {
    const messages = dto.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    return this.chatService.chat({
      providerId: dto.providerId,
      modelId: dto.modelId,
      messages,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
    })
  }

  /** 流式聊天（SSE） */
  @Sse('chat/stream')
  chatStream(@Body() dto: ChatDto): Observable<MessageEvent> {
    const messages = dto.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    return new Observable<MessageEvent>((subscriber) => {
      const generator = this.chatService.stream({
        providerId: dto.providerId,
        modelId: dto.modelId,
        messages,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      })

      ;(async () => {
        try {
          for await (const chunk of generator) {
            subscriber.next({ data: chunk } as MessageEvent)
          }
          subscriber.next({ data: '[DONE]' } as MessageEvent)
          subscriber.complete()
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          subscriber.error({ data: `ERROR: ${message}` } as MessageEvent)
        }
      })()
    })
  }
}
