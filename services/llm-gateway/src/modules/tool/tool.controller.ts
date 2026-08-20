import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { PlatformApi } from '@/common/decorators/platform-api.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CreateToolDto } from './dto/tool.dto';
import { ToolService } from './tool.service';

@PlatformApi()
@Controller('api/tools')
export class ToolController {
    constructor(private readonly tools: ToolService) {}
    @Get() list() {
        return this.tools.list();
    }

    @Post() @Roles('ADMIN') create(@Body() dto: CreateToolDto) {
        return this.tools.create(dto);
    }

    @Delete(':id') @Roles('ADMIN') async delete(@Param('id') id: string) {
        await this.tools.delete(id);
        return { success: true };
    }
}
