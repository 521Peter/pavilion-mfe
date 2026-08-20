import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSkillDto {
    @IsString()
    @MaxLength(64)
    name!: string;

    @IsString()
    @IsOptional()
    description?: string;
}

export class WriteFileDto {
    @IsString()
    path!: string;

    @IsString()
    content!: string;
}

export class BrowseRemoteDto {
    @IsString()
    owner!: string;

    @IsString()
    repo!: string;

    @IsString()
    branch!: string;

    @IsString()
    @IsOptional()
    path?: string;
}

export class InstallRemoteDto {
    @IsString()
    owner!: string;

    @IsString()
    repo!: string;

    @IsString()
    branch!: string;

    @IsString()
    skillName!: string;

    @IsString()
    @IsOptional()
    skillPath?: string;
}

export class AddSkillRepoDto {
    @IsString()
    owner!: string;

    @IsString()
    name!: string;

    @IsString()
    @IsOptional()
    branch?: string;
}
