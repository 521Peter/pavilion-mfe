import { Type } from "class-transformer";
import { IsArray, IsIn, IsObject, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import { OpenAiMessageDto } from "@/modules/inference/dto/inference.dto";

export class CreateAgentDto {
  @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) code!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
}

export class AgentToolBindingDto {
  @IsString() toolId!: string;
  @IsOptional() @IsIn(["never", "always"]) approvalPolicy?: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
}

export class AgentSkillBindingDto {
  @IsString() skillVersionId!: string;
  @IsOptional() @IsIn(["fixed", "auto"]) selectionMode?: string;
}

export class PublishAgentVersionDto {
  @IsString() virtualModelId!: string;
  @IsString() systemPrompt!: string;
  @IsOptional() @IsObject() runConfig?: Record<string, unknown>;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentToolBindingDto)
  tools?: AgentToolBindingDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentSkillBindingDto)
  skills?: AgentSkillBindingDto[];
}

export class RunAgentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpenAiMessageDto)
  messages!: OpenAiMessageDto[];

  @IsOptional() @IsString() requestId?: string;
}
