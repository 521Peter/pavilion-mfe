import { Controller, Post, Body, Get, Patch, Delete, Param } from "@nestjs/common";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ChatThreadService } from "../services/chat-thread.service";
import { CreateChatThreadDto, SaveChatMessageDto, UpdateChatThreadDto } from "../dto/chat-thread.dto";
import { PlatformApi } from "@/common/decorators/platform-api.decorator";

@PlatformApi()
@Controller("api/llm")
export class LlmChatController {
  constructor(private readonly threadService: ChatThreadService) {}

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
