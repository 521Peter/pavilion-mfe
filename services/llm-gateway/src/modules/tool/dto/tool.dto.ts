import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateToolDto {
    @IsString() name!: string;
    @IsOptional() @IsString() description?: string;
    @IsIn(['native', 'openapi', 'mcp']) type!: string;
    @IsObject() inputSchema!: Record<string, unknown>;
    @IsOptional() @IsObject() config?: Record<string, unknown>;
    @IsOptional() @IsString() mcpServerId?: string;
    @IsOptional() @IsBoolean() isActive?: boolean;
}
