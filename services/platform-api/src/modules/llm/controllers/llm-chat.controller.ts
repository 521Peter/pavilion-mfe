import { Controller, Post, Body, Get, Patch, Delete, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { LlmChatService } from "../services/llm-chat.service";
import { ChatDto } from "../dto/chat.dto";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ChatThreadService } from "../services/chat-thread.service";
import { CreateChatThreadDto, SaveChatMessageDto, UpdateChatThreadDto } from "../dto/chat-thread.dto";

@Controller("llm")
export class LlmChatController {
  constructor(
    private readonly chatService: LlmChatService,
    private readonly threadService: ChatThreadService
  ) {}

  /** 非流式聊天 */
  @Post("chat")
  async chat(@Body() dto: ChatDto) {
    const messages = dto.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    return this.chatService.chat({
      providerId: dto.providerId,
      modelId: dto.modelId,
      messages,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens
    });
  }

  /** 流式聊天。使用 fetch POST 消费 SSE，既能提交消息体也能携带 JWT。 */
  @Post("chat/stream")
  async chatStream(@Body() dto: ChatDto, @Res() response: Response): Promise<void> {
    const messages = dto.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    response.status(200);
    response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();
    let disconnected = false;
    response.on("close", () => {
      disconnected = true;
    });

    try {
      const generator = this.chatService.stream({
        providerId: dto.providerId,
        modelId: dto.modelId,
        messages,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens
      });

      for await (const chunk of generator) {
        if (disconnected) break;
        response.write(`data: ${JSON.stringify({ type: "delta", delta: chunk })}\n\n`);
      }
      if (!disconnected) response.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!disconnected) response.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    } finally {
      response.end();
    }
  }

  @Get("chat/threads")
  listThreads(@CurrentUser("sub") userId: string) {
    return this.threadService.list(userId);
  }

  @Post("chat/threads")
  createThread(@CurrentUser("sub") userId: string, @Body() dto: CreateChatThreadDto) {
    return this.threadService.create(userId, dto.id);
  }

  @Get("chat/threads/:id")
  getThread(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    return this.threadService.get(userId, id);
  }

  @Patch("chat/threads/:id")
  updateThread(@CurrentUser("sub") userId: string, @Param("id") id: string, @Body() dto: UpdateChatThreadDto) {
    return this.threadService.update(userId, id, dto);
  }

  @Delete("chat/threads/:id")
  async deleteThread(@CurrentUser("sub") userId: string, @Param("id") id: string) {
    await this.threadService.delete(userId, id);
    return { success: true };
  }

  @Post("chat/threads/:threadId/messages/:messageId")
  async saveMessage(
    @CurrentUser("sub") userId: string,
    @Param("threadId") threadId: string,
    @Param("messageId") messageId: string,
    @Body() dto: SaveChatMessageDto
  ) {
    await this.threadService.saveMessage(userId, threadId, messageId, dto);
    return { success: true };
  }
}
