import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class GatewayIdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.header("auth-user-id");
    if (!userId) {
      throw new ForbiddenException("缺少网关注入的用户身份");
    }
    return true;
  }
}
