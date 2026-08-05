import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { Public } from '@/common/decorators/public.decorator'
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Get('profile')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub)
  }
}
