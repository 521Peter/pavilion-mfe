import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '@/database/prisma.service'
import type { JwtPayload } from '@/common/decorators/current-user.decorator'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('app.jwtSecret')!,
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }
    return {
      sub: user.id,
      username: user.username,
      roles: user.roles,
    } satisfies JwtPayload
  }
}
