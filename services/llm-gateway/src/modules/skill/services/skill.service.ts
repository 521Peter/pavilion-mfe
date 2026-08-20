import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SkillLoaderService, type FileNode } from './skill-loader.service';
import { createHash } from 'node:crypto';

/** 远程仓库中可用的 skill */
export interface RemoteSkillInfo {
    name: string;
    description: string;
    path: string;
}

@Injectable()
export class SkillService {
    private readonly logger = new Logger(SkillService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly loader: SkillLoaderService
    ) {}

    // ─── 本地 Skill ───

    async list() {
        const dirNames = await this.loader.listSkillDirs();
        const results = [];

        for (const name of dirNames) {
            const skill = await this.loader.readSkill(name);
            if (!skill) continue;

            const meta = await this.prisma.skill.findUnique({ where: { name } });

            results.push({
                name: skill.name,
                description: skill.description,
                source: meta?.source ?? 'local',
                repoOwner: meta?.repoOwner ?? null,
                repoName: meta?.repoName ?? null,
                isActive: meta?.isActive ?? true,
                fileCount: this.countFiles(skill.fileTree),
                contentHash: meta?.contentHash ?? null
            });
        }
        return results;
    }

    async get(name: string) {
        const skill = await this.loader.readSkill(name);
        if (!skill) throw new NotFoundException('Skill 不存在');

        const meta = await this.prisma.skill.findUnique({ where: { name } });

        return {
            name: skill.name,
            description: skill.description,
            directory: skill.directory,
            skillMd: skill.skillMd,
            fileTree: skill.fileTree,
            source: meta?.source ?? 'local',
            repoOwner: meta?.repoOwner ?? null,
            repoName: meta?.repoName ?? null,
            readmeUrl: meta?.readmeUrl ?? null,
            contentHash: meta?.contentHash ?? null,
            updatedAt: meta?.updatedAt ?? null
        };
    }

    async readFile(name: string, filePath: string) {
        const content = await this.loader.readFile(name, filePath);
        if (content === null) throw new NotFoundException('文件不存在');
        return { path: filePath, content };
    }

    async writeFile(name: string, filePath: string, content: string) {
        await this.loader.writeFile(name, filePath, content);
        await this.ensureMeta(name);
        return { success: true };
    }

    async create(name: string, description: string) {
        const content = `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\n在这里编写 Skill 内容...\n`;
        await this.loader.createSkill(name, content);
        await this.prisma.skill.upsert({
            where: { name },
            create: { name, description, source: 'local' },
            update: { description, source: 'local' }
        });
        return this.get(name);
    }

    async delete(name: string) {
        await this.loader.removeSkill(name);
        await this.prisma.skill.deleteMany({ where: { name } });
    }

    async toggle(name: string, isActive: boolean) {
        await this.ensureMeta(name);
        return this.prisma.skill.update({ where: { name }, data: { isActive } });
    }

    async publishVersion(name: string) {
        const current = await this.get(name);
        const skill = await this.prisma.skill.upsert({
            where: { name },
            create: { name, description: current.description, source: current.source },
            update: { description: current.description }
        });
        const contentHash = createHash('sha256').update(current.skillMd).digest('hex');
        const existing = await this.prisma.skillVersion.findUnique({
            where: { skillId_contentHash: { skillId: skill.id, contentHash } }
        });
        if (existing) return existing;
        const latest = await this.prisma.skillVersion.aggregate({
            where: { skillId: skill.id },
            _max: { version: true }
        });
        return this.prisma.skillVersion.create({
            data: {
                skillId: skill.id,
                version: (latest._max.version ?? 0) + 1,
                contentHash,
                storageUri: `file://${current.directory}/SKILL.md`,
                content: current.skillMd
            }
        });
    }

    // ─── 远程安装 ───

    /**
     * 浏览远程 GitHub 仓库中的 skills 列表
     * 支持两种仓库结构:
     *   1. <repo>/skills/<skill-name>/SKILL.md  — 多 skill 仓库
     *   2. <repo>/SKILL.md                      — 单 skill 仓库（repo 本身就是一个 skill）
     * 如果传了 path 参数，则在该 path 下搜索子目录中的 SKILL.md
     */
    async browseRemote(owner: string, repo: string, branch: string, path?: string): Promise<RemoteSkillInfo[]> {
        // 优先搜索指定 path，然后 skills/ 目录，最后回退到仓库根
        const searchPaths = path ? [path] : ['skills', ''];

        for (const searchPath of searchPaths) {
            this.logger.log(`尝试浏览远程 skill 仓库: ${owner}/${repo}/${branch}/${searchPath || '(root)'}`);

            const entries = await this.fetchGithubContents(owner, repo, branch, searchPath);
            if (!entries) continue;

            // 检查 searchPath 本身是否直接是一个 skill（含 SKILL.md）
            const hasSkillMd = entries.some((e: any) => e.type === 'file' && e.name === 'SKILL.md');
            if (hasSkillMd) {
                // 仓库根、skills/ 目录、或用户指定的子目录本身就是单个 skill
                const skillName = searchPath ? searchPath.split('/').pop()! : repo;
                const mdPath = searchPath ? `${searchPath}/SKILL.md` : 'SKILL.md';
                const description = await this.fetchSkillDescription(owner, repo, branch, mdPath);
                return [
                    {
                        name: skillName,
                        description,
                        path: searchPath || ''
                    }
                ];
            }

            // 扫描子目录寻找 SKILL.md
            const dirEntries = entries.filter((e: any) => e.type === 'dir');
            if (dirEntries.length > 0) {
                const skills: RemoteSkillInfo[] = [];
                for (const dir of dirEntries) {
                    const dirPath = searchPath ? `${searchPath}/${dir.name}` : dir.name;
                    try {
                        const subEntries = await this.fetchGithubContents(owner, repo, branch, dirPath);
                        if (!subEntries) continue;
                        const hasMd = subEntries.some((e: any) => e.type === 'file' && e.name === 'SKILL.md');
                        if (hasMd) {
                            const description = await this.fetchSkillDescription(
                                owner,
                                repo,
                                branch,
                                `${dirPath}/SKILL.md`
                            );
                            skills.push({ name: dir.name, description, path: dirPath });
                        }
                    } catch {
                        /* skip */
                    }
                }
                if (skills.length > 0) return skills;
            }
        }

        return [];
    }

    /**
     * 从远程仓库安装一个 skill（递归下载整个文件夹）
     * skillPath 指定 skill 在仓库中的路径（如 "skills/my-skill" 或 "" 表示仓库根）
     */
    async installRemote(owner: string, repo: string, branch: string, skillName: string, skillPath?: string) {
        // skillPath 为 undefined（未提供）时回退到默认 skills/ 目录；
        // 显式传入空字符串表示 skill 位于仓库根目录，不能用 || 兜底，否则会被误判为 falsy。
        const sourcePath = skillPath !== undefined ? skillPath : `skills/${skillName}`;
        this.logger.log(`安装远程 skill: ${owner}/${repo}/${branch}/${sourcePath || '(root)'} → ${skillName}`);

        // 递归获取目录树
        const files = await this.fetchGithubTree(owner, repo, branch, sourcePath);

        // 远端可用后再清理本地旧文件，避免误删（如远端 404 时保留现有 skill）。
        // 重新安装 = 全量覆盖，否则远端删除的文件会在本地残留。
        await this.loader.removeSkill(skillName);

        // 下载每个文件到本地
        const prefix = sourcePath ? `${sourcePath}/` : '';
        for (const file of files) {
            // 仅剥离 sourcePath 前缀；根目录 skill（prefix 为空）则保留完整路径
            const relPath = prefix && file.path.startsWith(prefix) ? file.path.slice(prefix.length) : file.path;
            const content = await this.downloadGithubFile(file.downloadUrl);
            await this.loader.writeFile(skillName, relPath, content);
        }

        // 读取 SKILL.md 元数据
        const skill = await this.loader.readSkill(skillName);
        const description = skill?.description ?? '';

        // 写入 DB
        const skillMdPath = sourcePath ? `${sourcePath}/SKILL.md` : 'SKILL.md';
        const readmeUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${skillMdPath}`;
        await this.prisma.skill.upsert({
            where: { name: skillName },
            create: {
                name: skillName,
                description,
                source: 'remote',
                repoOwner: owner,
                repoName: repo,
                repoBranch: branch,
                readmeUrl
            },
            update: {
                description,
                source: 'remote',
                repoOwner: owner,
                repoName: repo,
                repoBranch: branch,
                readmeUrl
            }
        });

        this.logger.log(`Skill "${skillName}" 安装完成，共 ${files.length} 个文件`);
        return this.get(skillName);
    }

    // ─── Skill 仓库源管理 ───

    async listRepos() {
        return this.prisma.skillRepo.findMany({ orderBy: { createdAt: 'asc' } });
    }

    async addRepo(owner: string, name: string, branch: string) {
        return this.prisma.skillRepo.create({ data: { owner, name, branch } });
    }

    async removeRepo(id: string) {
        await this.prisma.skillRepo.delete({ where: { id } });
    }

    // ─── 辅助方法 ───

    private async ensureMeta(name: string) {
        const existing = await this.prisma.skill.findUnique({ where: { name } });
        if (!existing) {
            const skill = await this.loader.readSkill(name);
            await this.prisma.skill.create({
                data: {
                    name,
                    description: skill?.description ?? '',
                    source: 'local'
                }
            });
        }
    }

    private countFiles(tree: FileNode[]): number {
        let count = 0;
        for (const node of tree) {
            if (node.type === 'file') count++;
            else if (node.children) count += this.countFiles(node.children);
        }
        return count;
    }

    /** 请求 GitHub Contents API */
    private async fetchGithubContents(
        owner: string,
        repo: string,
        branch: string,
        path: string
    ): Promise<any[] | null> {
        try {
            const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path || ''}?ref=${branch}`;
            const resp = await fetch(url, {
                headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ai-platform' }
            });
            if (!resp.ok) return null;
            const data = await resp.json();
            return Array.isArray(data) ? data : null;
        } catch {
            return null;
        }
    }

    /** 从 GitHub 下载 SKILL.md 并提取 description */
    private async fetchSkillDescription(
        owner: string,
        repo: string,
        branch: string,
        filePath: string
    ): Promise<string> {
        try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
            const resp = await fetch(rawUrl, { headers: { 'User-Agent': 'ai-platform' } });
            if (!resp.ok) return '';
            const raw = await resp.text();
            return this.loader.parseFrontmatter(raw).description ?? '';
        } catch {
            return '';
        }
    }

    /** 递归获取 GitHub 目录下所有文件 */
    private async fetchGithubTree(
        owner: string,
        repo: string,
        branch: string,
        path: string
    ): Promise<{ path: string; downloadUrl: string }[]> {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
        const resp = await fetch(url, {
            headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ai-platform' }
        });
        if (!resp.ok) throw new Error(`GitHub API 返回 ${resp.status}`);

        const entries = (await resp.json()) as any[];
        const files: { path: string; downloadUrl: string }[] = [];

        for (const entry of entries) {
            if (entry.type === 'file') {
                files.push({ path: entry.path, downloadUrl: entry.download_url });
            } else if (entry.type === 'dir') {
                const subFiles = await this.fetchGithubTree(owner, repo, branch, entry.path);
                files.push(...subFiles);
            }
        }
        return files;
    }

    private async downloadGithubFile(downloadUrl: string): Promise<string> {
        const resp = await fetch(downloadUrl, { headers: { 'User-Agent': 'ai-platform' } });
        if (!resp.ok) throw new Error(`下载文件失败: ${resp.status}`);
        return resp.text();
    }
}
