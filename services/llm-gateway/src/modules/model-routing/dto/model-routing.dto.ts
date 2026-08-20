import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNumberString,
    IsObject,
    IsOptional,
    IsString,
    Min,
    ValidateNested
} from 'class-validator';

export class CreateDeploymentDto {
    @IsString() name!: string;
    @IsString() providerId!: string;
    @IsOptional() @IsString() modelId?: string;
    @IsOptional() @IsString() credentialId?: string;
    @IsString() upstreamModel!: string;
    @IsOptional() @IsObject() config?: Record<string, unknown>;
    @IsOptional() @IsNumberString() inputPricePerM?: string;
    @IsOptional() @IsNumberString() outputPricePerM?: string;
    @IsOptional() @IsBoolean() isActive?: boolean;
}

export class RouteTargetDto {
    @IsString() deploymentId!: string;
    @IsOptional() @IsInt() @Min(0) priority?: number;
    @IsOptional() @IsInt() @Min(0) weight?: number;
}

export class CreateVirtualModelDto {
    @IsString() name!: string;
    @IsOptional() @IsString() displayName?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsString() strategy?: 'single' | 'fallback';
    @IsOptional() @IsInt() @Min(1) requestTimeout?: number;
    @IsOptional() @IsInt() @Min(0) maxRetries?: number;
    @IsArray() @ValidateNested({ each: true }) @Type(() => RouteTargetDto) targets!: RouteTargetDto[];
}
