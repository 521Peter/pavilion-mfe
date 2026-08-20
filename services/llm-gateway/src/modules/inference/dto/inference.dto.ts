import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDefined, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class OpenAiMessageDto {
    @IsIn(['system', 'user', 'assistant'])
    role!: 'system' | 'user' | 'assistant';

    @IsString()
    content!: string;
}

export class ChatCompletionsDto {
    @IsString() model!: string;
    @IsArray() @ValidateNested({ each: true }) @Type(() => OpenAiMessageDto) messages!: OpenAiMessageDto[];
    @IsOptional() @IsBoolean() stream?: boolean;
    @IsOptional() @IsNumber() temperature?: number;
    @IsOptional() @IsNumber() max_tokens?: number;
}

export class ResponsesDto {
    @IsString() model!: string;
    @IsDefined()
    input!: string | OpenAiMessageDto[];

    @IsOptional() @IsString() instructions?: string;
    @IsOptional() @IsBoolean() stream?: boolean;
    @IsOptional() @IsNumber() temperature?: number;
    @IsOptional() @IsNumber() max_output_tokens?: number;
}
