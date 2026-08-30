import { Controller, Get, Query } from "@nestjs/common";
import { PlatformApi } from "@/common/decorators/platform-api.decorator";
import { Roles } from "@/common/decorators/roles.decorator";
import { UsageFilterDto, UsageRunsDto, UsageTimeseriesDto } from "./dto/usage-query.dto";
import { UsageService } from "./usage.service";

@PlatformApi()
@Roles("ADMIN")
@Controller("api/usage")
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get("overview")
  overview(@Query() query: UsageFilterDto) {
    return this.usage.overview(query);
  }

  @Get("timeseries")
  timeseries(@Query() query: UsageTimeseriesDto) {
    return this.usage.timeseries(query);
  }

  @Get("breakdown")
  breakdown(@Query() query: UsageFilterDto) {
    return this.usage.breakdown(query);
  }

  @Get("runs")
  runs(@Query() query: UsageRunsDto) {
    return this.usage.runs(query);
  }
}
