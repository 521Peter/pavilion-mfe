import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChatThreadDto {
    @IsString()
    @MaxLength(100)
    id!: string;
}

export class UpdateChatThreadDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @IsOptional()
    @IsIn(['regular', 'archived'])
    status?: 'regular' | 'archived';
}

export class SaveChatMessageDto {
    @IsObject()
    message!: Record<string, unknown>;

    @IsOptional()
    @IsString()
    parentId?: string | null;

    @IsOptional()
    @IsObject()
    runConfig?: Record<string, unknown>;
}
