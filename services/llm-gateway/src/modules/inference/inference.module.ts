import { Module } from '@nestjs/common';
import { ApplicationModule } from '@/modules/application/application.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { ModelRoutingModule } from '@/modules/model-routing/model-routing.module';
import { ProviderModule } from '@/modules/provider/provider.module';
import { UsageModule } from '@/modules/usage/usage.module';
import { DataPlaneAuthGuard } from './data-plane-auth.guard';
import { InferenceController } from './inference.controller';
import { InferenceHooksService } from './inference-hooks.service';
import { InferenceService } from './inference.service';
import { RunService } from './run.service';
import { InferenceRateLimitGuard } from './inference-rate-limit.guard';

@Module({
    imports: [ApplicationModule, AuthModule, ModelRoutingModule, ProviderModule, UsageModule],
    controllers: [InferenceController],
    providers: [DataPlaneAuthGuard, InferenceRateLimitGuard, InferenceHooksService, InferenceService, RunService],
    exports: [InferenceService, RunService, DataPlaneAuthGuard, InferenceRateLimitGuard]
})
export class InferenceModule {}
