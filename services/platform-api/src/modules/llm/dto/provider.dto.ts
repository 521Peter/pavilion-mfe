import { IsString, IsOptional, IsBoolean, IsObject, MaxLength } from 'class-validator'

export class CreateProviderDto {
  @IsString()
  @MaxLength(100)
  name!: string

  @IsString()
  @MaxLength(50)
  type!: string // openai | ollama | ...

  @IsOptional()
  @IsString()
  baseUrl?: string

  @IsOptional()
  @IsString()
  apiKey?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string

  @IsOptional()
  @IsString()
  baseUrl?: string

  @IsOptional()
  @IsString()
  apiKey?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>
}
