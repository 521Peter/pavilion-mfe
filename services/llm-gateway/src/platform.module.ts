import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/database/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { LlmModule } from '@/modules/llm/llm.module';
import { McpModule } from '@/modules/mcp/mcp.module';
import { SkillModule } from '@/modules/skill/skill.module';
import { appConfig } from '@/config/platform.config';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { AllExceptionFilter } from '@/common/filters/all-exception.filter';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { SecurityModule } from '@/common/security/security.module';
import { ApplicationModule } from '@/modules/application/application.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { InferenceModule } from '@/modules/inference/inference.module';
import { ToolModule } from '@/modules/tool/tool.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env'],
            load: [appConfig]
        }),
        PrismaModule,
        SecurityModule,
        AuditModule,
        AuthModule,
        ApplicationModule,
        InferenceModule,
        ToolModule,
        LlmModule,
        McpModule,
        SkillModule
    ],
    providers: [TransformInterceptor, AllExceptionFilter, JwtAuthGuard, RolesGuard],
    exports: [AuthModule, ApplicationModule]
})
export class PlatformModule {}
