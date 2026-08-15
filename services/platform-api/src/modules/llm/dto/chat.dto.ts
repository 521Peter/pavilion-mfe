import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ChatMessageDto {
  @IsString()
  role!: "system" | "user" | "assistant";

  @IsString()
  content!: string;
}

export class ChatDto {
  @IsString()
  providerId!: string;

  @IsString()
  modelId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}
