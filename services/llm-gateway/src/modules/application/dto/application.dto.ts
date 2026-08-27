import { IsArray, IsBoolean, IsDateString, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreateApplicationDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  code!: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModels?: string[];
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedModels?: string[];
}

export class CreateApplicationKeyDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
