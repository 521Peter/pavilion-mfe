import { Type } from "class-transformer";
import { IsISO8601, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class UsageFilterDto {
  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsUUID()
  virtualModelId?: string;

  @IsOptional()
  @IsUUID()
  providerId?: string;

  @IsOptional()
  @IsIn(["completed", "failed", "cancelled"])
  status?: "completed" | "failed" | "cancelled";
}

export class UsageTimeseriesDto extends UsageFilterDto {
  @IsOptional()
  @IsIn(["hour", "day"])
  interval?: "hour" | "day";
}

export class UsageRunsDto extends UsageFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  requestId?: string;
}
