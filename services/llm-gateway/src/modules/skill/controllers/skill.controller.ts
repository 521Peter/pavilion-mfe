import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SkillService } from '../services/skill.service';
import { CreateSkillDto, WriteFileDto, BrowseRemoteDto, InstallRemoteDto, AddSkillRepoDto } from '../dto/skill.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { PlatformApi } from '@/common/decorators/platform-api.decorator';

@PlatformApi()
@Controller('api/skills')
export class SkillController {
    constructor(private readonly skillService: SkillService) {}

    // ─── 本地 Skill ───

    @Get()
    list() {
        return this.skillService.list();
    }

    @Get(':name')
    get(@Param('name') name: string) {
        return this.skillService.get(name);
    }

    @Get(':name/files')
    readFile(@Param('name') name: string, @Query('path') path: string) {
        return this.skillService.readFile(name, path);
    }

    @Post()
    @Roles('ADMIN')
    create(@Body() dto: CreateSkillDto) {
        return this.skillService.create(dto.name, dto.description ?? '');
    }

    @Post(':name/versions')
    @Roles('ADMIN')
    publishVersion(@Param('name') name: string) {
        return this.skillService.publishVersion(name);
    }

    @Put(':name/toggle')
    @Roles('ADMIN')
    toggle(@Param('name') name: string, @Body('isActive') isActive: boolean) {
        return this.skillService.toggle(name, isActive);
    }

    @Delete(':name')
    @Roles('ADMIN')
    async delete(@Param('name') name: string) {
        await this.skillService.delete(name);
        return { success: true };
    }

    // ─── Skill 文件编辑 ───

    @Put(':name/files')
    @Roles('ADMIN')
    writeFile(@Param('name') name: string, @Body() dto: WriteFileDto) {
        return this.skillService.writeFile(name, dto.path, dto.content);
    }

    // ─── 远程安装 ───

    @Post('remote/browse')
    @Roles('ADMIN')
    browseRemote(@Body() dto: BrowseRemoteDto) {
        return this.skillService.browseRemote(dto.owner, dto.repo, dto.branch, dto.path);
    }

    @Post('remote/install')
    @Roles('ADMIN')
    installRemote(@Body() dto: InstallRemoteDto) {
        return this.skillService.installRemote(dto.owner, dto.repo, dto.branch, dto.skillName, dto.skillPath);
    }

    // ─── Skill 仓库源 ───

    @Get('repos/list')
    listRepos() {
        return this.skillService.listRepos();
    }

    @Post('repos')
    @Roles('ADMIN')
    addRepo(@Body() dto: AddSkillRepoDto) {
        return this.skillService.addRepo(dto.owner, dto.name, dto.branch ?? 'main');
    }

    @Delete('repos/:id')
    @Roles('ADMIN')
    async removeRepo(@Param('id') id: string) {
        await this.skillService.removeRepo(id);
        return { success: true };
    }
}
