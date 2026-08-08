import { IsString, IsOptional, IsBoolean, IsObject, MaxLength } from 'class-validator'

export class CreateModelDto {
  @IsString()
  @MaxLength(100)
  modelName!: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelName?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}
