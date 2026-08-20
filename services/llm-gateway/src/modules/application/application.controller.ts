import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PlatformApi } from '@/common/decorators/platform-api.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ApplicationService } from './application.service';
import { ApplicationKeyService } from './application-key.service';
import { CreateApplicationDto, CreateApplicationKeyDto, UpdateApplicationDto } from './dto/application.dto';

@PlatformApi()
@Roles('ADMIN')
@Controller('api/applications')
export class ApplicationController {
    constructor(
        private readonly applications: ApplicationService,
        private readonly keys: ApplicationKeyService
    ) {}

    @Get()
    list() {
        return this.applications.list();
    }

    @Post()
    create(@Body() dto: CreateApplicationDto) {
        return this.applications.create(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
        return this.applications.update(id, dto);
    }

    @Post(':id/keys')
    createKey(@Param('id') id: string, @Body() dto: CreateApplicationKeyDto) {
        return this.keys.create(id, dto.name, dto.expiresAt);
    }

    @Delete(':id/keys/:keyId')
    async revokeKey(@Param('id') id: string, @Param('keyId') keyId: string) {
        await this.keys.revoke(id, keyId);
        return { success: true };
    }
}
