import { Controller, Get, Query } from '@nestjs/common';
import { PlatformApi } from '@/common/decorators/platform-api.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UsageService } from './usage.service';

@PlatformApi()
@Roles('ADMIN')
@Controller('api/usage')
export class UsageController {
    constructor(private readonly usage: UsageService) {}

    @Get()
    list(
        @Query('userId') userId?: string,
        @Query('applicationId') applicationId?: string,
        @Query('virtualModelId') virtualModelId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        return this.usage.list({
            userId,
            applicationId,
            virtualModelId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined
        });
    }

    @Get('summary')
    summary(
        @Query('applicationId') applicationId?: string,
        @Query('virtualModelId') virtualModelId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        return this.usage.summary({
            applicationId,
            virtualModelId,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined
        });
    }
}
