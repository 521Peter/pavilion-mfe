import { Body, Controller, Get, Headers, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { GatewayIdentityGuard } from "./gateway-identity.guard";
import { SendMessageDto } from "./dto/send-message.dto";
import { SupportService } from "./support.service";

@ApiTags("support")
@ApiSecurity("auth-user-id")
@UseGuards(GatewayIdentityGuard)
@Controller("support")
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get("session")
  @ApiOperation({ summary: "Create or restore the current user support session" })
  getSession(@Headers("auth-user-id") userId: string) {
    return this.success(this.supportService.getSession(userId));
  }

  @Post("messages")
  @ApiOperation({ summary: "Send a message to the AI customer service agent" })
  sendMessage(@Headers("auth-user-id") userId: string, @Body() dto: SendMessageDto) {
    return this.success({
      ...this.supportService.reply(dto.message),
      gateway: {
        authenticated: true,
        forwardedUserId: userId
      }
    });
  }

  private success<T>(data: T): { code: 0; data: T; msg: "ok" } {
    return { code: 0, data, msg: "ok" };
  }
}
