import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core'
import { PrismaModule } from '@/database/prisma.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { LlmModule } from '@/modules/llm/llm.module'
import { appConfig } from '@/config'
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor'
import { AllExceptionFilter } from '@/common/filters/all-exception.filter'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig],
    }),
    PrismaModule,
    AuthModule,
    LlmModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
