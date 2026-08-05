import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export interface JwtPayload {
  sub: string
  username: string
  roles: string[]
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      user?: JwtPayload
    }>()
    const user = request.user
    return data ? user?.[data] : user
  },
)
