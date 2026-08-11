import { Injectable, Logger } from '@nestjs/common'
import { readFile, readdir, writeFile, mkdir, rm, stat } from 'node:fs/promises'
import { join, relative, dirname } from 'node:path'

/** 文件树节点 */
export interface FileNode {
  name: string
  path: string        // 相对于 skill 目录的路径
  type: 'file' | 'dir'
  size?: number
  children?: FileNode[]
}

/** 解析后的 Skill */
export interface ParsedSkill {
  name: string
  description: string
  directory: string
  skillMd: string     // SKILL.md 全文
  fileTree: FileNode[] // 目录树
}

/**
 * Skill Loader — 文件系统操作层
 *
 * Skill 以完整文件夹方式存储，与 cc-switch / Codex 一致：
 *   skills/<skill-name>/SKILL.md       ← 必须
 *   skills/<skill-name>/references/    ← 可选
 *   skills/<skill-name>/scripts/       ← 可选
 *   skills/<skill-name>/assets/        ← 可选
 */
@Injectable()
export class SkillLoaderService {
  private readonly logger = new Logger(SkillLoaderService.name)

  get skillsRoot(): string {
    return process.env.SKILLS_DIR || join(process.cwd(), '..', 'skills')
  }

  /** 列出 skills 目录下所有 skill 目录名 */
  async listSkillDirs(): Promise<string[]> {
    try {
      const entries = await readdir(this.skillsRoot, { withFileTypes: true })
      const dirs: string[] = []
      for (const e of entries) {
        if (!e.isDirectory() || e.name.startsWith('.')) continue
        // 必须包含 SKILL.md 才算合法 skill
        try {
          await stat(join(this.skillsRoot, e.name, 'SKILL.md'))
          dirs.push(e.name)
        } catch { /* skip */ }
      }
      return dirs
    } catch {
      await mkdir(this.skillsRoot, { recursive: true })
      return []
    }
  }

  /** 读取完整 skill（SKILL.md + 目录树） */
  async readSkill(name: string): Promise<ParsedSkill | null> {
    const dir = join(this.skillsRoot, name)
    const skillPath = join(dir, 'SKILL.md')
    try {
      const skillMd = await readFile(skillPath, 'utf-8')
      const fileTree = await this.buildFileTree(dir, '')
      const meta = this.parseFrontmatter(skillMd)
      return {
        // 目录名是 skill 的唯一标识（与 cc-switch / Codex 一致）；
        // frontmatter 的 name 字段仅为元数据，不参与寻址，避免与目录名不一致导致 404。
        name,
        description: meta.description ?? '',
        directory: dir,
        skillMd,
        fileTree,
      }
    } catch {
      return null
    }
  }

  /** 读取 skill 目录下某个文件的内容 */
  async readFile(name: string, filePath: string): Promise<string | null> {
    const fullPath = join(this.skillsRoot, name, filePath)
    try {
      return await readFile(fullPath, 'utf-8')
    } catch {
      return null
    }
  }

  /** 写入/更新 skill 目录下某个文件 */
  async writeFile(name: string, filePath: string, content: string): Promise<void> {
    const fullPath = join(this.skillsRoot, name, filePath)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, content, 'utf-8')
  }

  /** 删除 skill 目录 */
  async removeSkill(name: string): Promise<void> {
    await rm(join(this.skillsRoot, name), { recursive: true, force: true })
  }

  /** 创建空 skill（只含 SKILL.md） */
  async createSkill(name: string, skillMdContent: string): Promise<void> {
    const dir = join(this.skillsRoot, name)
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'SKILL.md'), skillMdContent, 'utf-8')
  }

  /** 解析 SKILL.md frontmatter（支持简单值、引号、以及 `|` / `>` 块标量） */
  parseFrontmatter(raw: string): { name?: string; description?: string; body: string } {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    if (!match) return { body: raw }
    const metaBlock = match[1]
    const body = match[2]
    const result = this.parseYamlLite(metaBlock)
    return { name: result.name, description: result.description, body }
  }

  /**
   * 极简 YAML frontmatter 解析器，覆盖真实 SKILL.md 中常见的写法：
   *   - `key: value`
   *   - `key: "quoted value"` / `key: 'quoted'`
   *   - `key: |` 或 `key: |-`（字面块，保留换行）
   *   - `key: >` 或 `key: >-`（折叠块，换行合并为空格）
   * 不依赖完整 YAML 库，避免引入额外依赖。
   */
  private parseYamlLite(block: string): Record<string, string> {
    const lines = block.split(/\r?\n/)
    const result: Record<string, string> = {}
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const m = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/)
      if (!m) { i++; continue }
      const key = m[1]
      const rest = m[2]

      const blockScalar = rest.match(/^([|>])([-+]?)\s*$/)
      if (blockScalar) {
        const folded = blockScalar[1] === '>'
        const collected: string[] = []
        i++
        while (i < lines.length) {
          const bl = lines[i]
          if (bl === '') { collected.push(''); i++; continue }   // 空行保留
          if (!/^\s/.test(bl)) break                              // 非缩进 → 块结束
          collected.push(bl.replace(/^ {1,}/, ''))               // 去掉一级缩进
          i++
        }
        const text = folded
          ? collected.join('\n').replace(/\n+/g, ' ').trim()
          : collected.join('\n').replace(/\n+$/, '')
        result[key] = text
        continue
      }

      result[key] = rest.trim().replace(/^["']|["']$/g, '')
      i++
    }
    return result
  }

  /** 递归构建文件树 */
  private async buildFileTree(baseDir: string, relPath: string): Promise<FileNode[]> {
    const fullPath = join(baseDir, relPath)
    const entries = await readdir(fullPath, { withFileTypes: true })
    const nodes: FileNode[] = []

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const childRel = relPath ? join(relPath, entry.name) : entry.name
      if (entry.isDirectory()) {
        nodes.push({
          name: entry.name,
          path: childRel,
          type: 'dir',
          children: await this.buildFileTree(baseDir, childRel),
        })
      } else {
        const s = await stat(join(fullPath, entry.name))
        nodes.push({
          name: entry.name,
          path: childRel,
          type: 'file',
          size: s.size,
        })
      }
    }
    // 文件夹优先，再按名称排序
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return nodes
  }
}
