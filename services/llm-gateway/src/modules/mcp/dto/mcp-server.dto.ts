import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsInt, MaxLength, IsIn } from "class-validator";

const TRANSPORTS = ["stdio", "http", "streamable-http"] as const;

export class CreateMcpServerDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(64)
  identifier!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsIn(TRANSPORTS)
  transport!: string;

  @IsOptional()
  @IsString()
  command?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  args?: string[];

  @IsOptional()
  @IsObject()
  env?: Record<string, string>;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsInt()
  timeout?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMcpServerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  identifier?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsIn(TRANSPORTS)
  transport?: string;

  @IsOptional()
  @IsString()
  command?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  args?: string[];

  @IsOptional()
  @IsObject()
  env?: Record<string, string>;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsInt()
  timeout?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
