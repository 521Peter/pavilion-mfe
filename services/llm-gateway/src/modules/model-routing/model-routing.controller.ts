import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PlatformApi } from '@/common/decorators/platform-api.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CreateDeploymentDto, CreateVirtualModelDto } from './dto/model-routing.dto';
import { ModelRoutingService } from './model-routing.service';

@PlatformApi()
@Controller('api/llm')
export class ModelRoutingController {
    constructor(private readonly routing: ModelRoutingService) {}

    @Get('deployments') listDeployments() {
        return this.routing.listDeployments();
    }

    @Post('deployments') @Roles('ADMIN') createDeployment(@Body() dto: CreateDeploymentDto) {
        return this.routing.createDeployment(dto);
    }

    @Delete('deployments/:id') @Roles('ADMIN') async deleteDeployment(@Param('id') id: string) {
        await this.routing.deleteDeployment(id);
        return { success: true };
    }

    @Get('virtual-models') listVirtualModels() {
        return this.routing.listVirtualModels();
    }

    @Post('virtual-models') @Roles('ADMIN') createVirtualModel(@Body() dto: CreateVirtualModelDto) {
        return this.routing.createVirtualModel(dto);
    }
}
