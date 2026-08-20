import { Module } from '@nestjs/common';
import { ModelRoutingController } from './model-routing.controller';
import { ModelRoutingService } from './model-routing.service';

@Module({
    controllers: [ModelRoutingController],
    providers: [ModelRoutingService],
    exports: [ModelRoutingService]
})
export class ModelRoutingModule {}
