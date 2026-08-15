import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "@/database/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import type { JwtPayload } from "@/common/decorators/current-user.decorator";

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username }
    });
    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException("用户名或密码错误");
    }
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("账号已被禁用");
    }
    return this.signToken(user.id, user.username, user.roles);
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { username: dto.username }
    });
    if (exists) {
      throw new ConflictException("用户名已存在");
    }
    const hashed = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        password: hashed,
        nickname: dto.nickname ?? dto.username,
        roles: ["USER"]
      }
    });
    return this.signToken(user.id, user.username, user.roles);
  }

  getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        avatar: true,
        roles: true,
        status: true,
        createdAt: true
      }
    });
  }

  private signToken(sub: string, username: string, roles: string[]) {
    const payload: JwtPayload = { sub, username, roles };
    const expiresIn = this.configService.get<string>("app.jwtExpiresIn") ?? "7d";
    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }
}
