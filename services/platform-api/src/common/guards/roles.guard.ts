import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import type { JwtPayload } from '../decorators/current-user.decorator'

/**
 * 角色守卫
 *
 * 需要在 JwtAuthGuard 之后执行（都注册为 APP_GUARD，按声明顺序依次执行）。
 * JwtAuthGuard 先完成认证，将 user 注入 request；RolesGuard 再做授权。
 *
 * - 接口未标记 @Roles() → 允许所有已登录用户
 * - 接口标记 @Roles('ADMIN') → 仅 ADMIN 可访问
 */
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic) return true

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!requiredRoles || requiredRoles.length === 0) return true

    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload
    }>()
    const user = request.user
    if (!user || !user.roles) {
      throw new ForbiddenException('无权限访问该资源')
    }

 const hasRole = user.roles.some((role) => requiredRoles.includes(role))
    if (!hasRole) {
      throw new ForbiddenException('无权限访问该资源')
    }

    return true
  }
}
