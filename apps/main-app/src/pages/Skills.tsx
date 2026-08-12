import { useState, useEffect, useCallback } from 'react'
import {
  skillApi,
  type SkillSummary,
  type SkillDetail,
  type FileNode,
  type RemoteSkillInfo,
} from '../api/skill'
import {
  Button,
  Card,
  Chip,
  Input,
  Modal,
  Skeleton,
  Switch,
} from '@heroui/react'

// ─── 图标 ───
const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const PlusIcon = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M12 5v14M5 12h14" /></svg>
const EditIcon = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>
const TrashIcon = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
const SparklesIcon = ({ size = 20 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
const DownloadIcon = ({ size = 16 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>
const FolderIcon = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
const FileIcon = ({ size = 14 }: { size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z" /><path d="M14 2v6h6" /></svg>
const ChevronIcon = ({ size = 12, open }: { size?: number; open?: boolean }) => <svg width={size} height={size} viewBox="0 0 24 24" {...ic} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}><path d="m9 18 6-6-6-6" /></svg>

const labelClass = 'block mb-1.5 text-[13px] font-medium text-text-regular'

function Toggle({ isSelected, onChange }: { isSelected: boolean; onChange: (v: boolean) => void }) {
  return <Switch isSelected={isSelected} onChange={onChange} size="sm"><Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content></Switch>
}

function sourceColor(s: string): 'accent' | 'success' {
  return s === 'remote' ? 'success' : 'accent'
}

// ─── 文件树节点 ───
function TreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileNode
  depth: number
  selectedPath: string
  onSelect: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)

  if (node.type === 'dir') {
    return (
      <div>
        <div
          className="flex items-center gap-1 py-1.5 px-2 cursor-pointer hover:bg-background rounded text-[13px] text-text-regular"
          style={{ paddingLeft: depth * 16 + 8 }}
          onClick={() => setExpanded(!expanded)}
        >
          <ChevronIcon open={expanded} />
          <FolderIcon />
          <span>{node.name}</span>
        </div>
        {expanded && node.children?.map((child) => (
          <TreeItem key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
      </div>
    )
  }
  return (
    <div
      className={`flex items-center gap-1.5 py-1.5 px-2 cursor-pointer rounded text-[13px] ${selectedPath === node.path ? 'bg-primary/10 text-primary' : 'text-text-regular hover:bg-background'}`}
      style={{ paddingLeft: depth * 16 + 22 }}
      onClick={() => onSelect(node.path)}
    >
      <FileIcon />
      <span className="truncate">{node.name}</span>
      {node.size != null && <span className="ml-auto text-xs text-text-muted">{node.size > 1024 ? `${Math.round(node.size / 1024)}K` : `${node.size}B`}</span>}
    </div>
  )
}

// ─── Skill 详情面板 ───
function SkillDetailPanel({ skill, onClose }: { skill: SkillDetail; onClose: () => void }) {
  const [selectedPath, setSelectedPath] = useState('SKILL.md')
  const [fileContent, setFileContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSelectedPath('SKILL.md')
  }, [skill.name])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setEditing(false)
    skillApi.readFile(skill.name, selectedPath).then(res => {
      if (!cancelled) {
        setFileContent(res.content)
        setEditContent(res.content)
        setLoading(false)
      }
    }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [skill.name, selectedPath])

  async function handleSave() {
    setSaving(true)
    try {
      await skillApi.writeFile(skill.name, selectedPath, editContent)
      setFileContent(editContent)
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-[500px]">
      {/* 文件树 */}
      <div className="w-[220px] shrink-0 border-r border-border overflow-y-auto p-2">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-2">文件</div>
        {skill.fileTree.map(node => (
          <TreeItem key={node.path} node={node} depth={0} selectedPath={selectedPath} onSelect={setSelectedPath} />
        ))}
      </div>

      {/* 文件内容 */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-[13px] font-medium text-text-regular truncate">{selectedPath}</span>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onPress={() => { setEditing(false); setEditContent(fileContent) }}>取消</Button>
                <Button variant="primary" size="sm" onPress={handleSave} isDisabled={saving}>{saving ? '保存中...' : '保存'}</Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onPress={() => { setEditing(true); setEditContent(fileContent) }}><EditIcon /> 编辑</Button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <Skeleton className="h-full w-full rounded" />
          ) : editing ? (
            <textarea
              className="w-full h-full font-mono text-[13px] p-3 rounded-lg border border-border bg-background text-text-primary resize-none outline-none focus:border-primary"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          ) : (
            <pre className="text-[13px] font-mono text-text-primary whitespace-pre-wrap break-words m-0">{fileContent}</pre>
          )}
        </div>
        <div className="flex justify-end px-4 py-3 border-t border-border">
          <Button variant="outline" onPress={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  )
}

// ─── 远程安装面板 ───
function RemoteInstallPanel({ onClose, onInstalled }: { onClose: () => void; onInstalled?: () => void }) {
  const [url, setUrl] = useState('')
  const [owner, setOwner] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<RemoteSkillInfo[] | null>(null)
  const [error, setError] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)
  const [directSkill, setDirectSkill] = useState<string | null>(null)
  const [directPath, setDirectPath] = useState<string | null>(null)

  /**
   * 解析 GitHub URL，提取 owner/repo/branch 以及可能的 skill 路径
   * 支持的 URL 格式:
   *   https://github.com/{owner}/{repo}
   *   https://github.com/{owner}/{repo}/tree/{branch}
   *   https://github.com/{owner}/{repo}/tree/{branch}/skills/{skillName}
   *   https://github.com/{owner}/{repo}/tree/{branch}/{path}/to/{skillName}
   *   https://github.com/{owner}/{repo}/blob/{branch}/skills/{skillName}/SKILL.md
   */
  function parseUrl(input: string) {
    setDirectSkill(null)
    setDirectPath(null)

    // 将 /blob/ 替换为 /tree/ 以统一处理
    const normalized = input.trim().replace('/blob/', '/tree/')

    // owner 贪婪到 `/`；repo 贪婪到 `/`、`?`、`#` 或结尾（不能用懒匹配 +?，
    // 否则 repo 只会匹配到第一个字符）。tree 之后的 path 可为空（仅指定分支的情况）。
    // .git 后缀在下面统一剥离。
    const m = normalized.match(/github\.com\/([^/\s]+)\/([^/\s?#]+)(?:\.git)?(?:\/tree\/([^/\s?#]+)((?:\/[^\s?#]*)*))?/)
    if (m) {
      setOwner(m[1])
      setRepo(m[2].replace(/\.git$/, ''))
      if (m[3]) setBranch(m[3])

      // 解析 tree 之后的路径，寻找 skill
      if (m[4]) {
        const pathParts = m[4].split('/').filter(Boolean)
        // 路径以 SKILL.md 结尾时，取其父目录作为 skill 路径
        const cleanParts = pathParts[pathParts.length - 1] === 'SKILL.md' ? pathParts.slice(0, -1) : pathParts

        // 尝试识别 skills/{skillName} 模式
        const skillsIdx = cleanParts.indexOf('skills')
        if (skillsIdx >= 0 && cleanParts[skillsIdx + 1]) {
          const skillName = cleanParts[skillsIdx + 1]
          setDirectSkill(skillName)
          setDirectPath(`skills/${skillName}`)
        } else if (cleanParts.length > 0) {
          // 直接路径模式: 取最后一段作为 skill 名
          const skillName = cleanParts[cleanParts.length - 1]
          setDirectSkill(skillName)
          setDirectPath(cleanParts.join('/'))
        }
      }
    }
  }

  async function handleSearch() {
    if (!owner || !repo) return
    setLoading(true)
    setError('')
    setSkills(null)
    try {
      if (directSkill && directPath) {
        // URL 直接指向某个 skill，直接安装
        setInstalling(directSkill)
        await skillApi.installRemote({ owner, repo, branch, skillName: directSkill, skillPath: directPath })
        alert(`Skill "${directSkill}" 安装成功`)
        onInstalled?.()
        onClose()
        return
      }
      // 浏览仓库中的可用 skills
      const result = await skillApi.browseRemote({ owner, repo, branch, path: directPath || undefined })
      setSkills(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
      setInstalling(null)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !loading) handleSearch()
  }

  async function handleInstall(skill: RemoteSkillInfo) {
    const name = skill.name
    setInstalling(name)
    try {
      await skillApi.installRemote({ owner, repo, branch, skillName: name, skillPath: skill.path })
      alert(`Skill "${name}" 安装成功`)
      onInstalled?.()
      onClose()
    } catch (err) {
      alert(err instanceof Error ? err.message : '安装失败')
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div>
      {/* URL 输入：粘贴后自动解析 owner/repo，无需手动填写 */}
      <div className="flex gap-2 mb-3">
        <Input
          variant="primary"
          value={url}
          onChange={e => { setUrl(e.target.value); parseUrl(e.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="粘贴 GitHub 链接，如 https://github.com/owner/repo"
          fullWidth
          autoFocus
        />
        <Button variant="primary" onPress={handleSearch} isDisabled={loading || (!owner && !url)}>
          {loading ? '搜索中...' : '搜索'}
        </Button>
      </div>

      {/* 当前解析结果 + 分支（默认 main，可改） */}
      {(owner || repo) && (
        <div className="mb-3 flex items-center gap-2 text-xs text-text-muted flex-wrap">
          <span className="font-medium text-text-regular">{owner}/{repo}</span>
          <span className="text-text-muted">·</span>
          <label className="flex items-center gap-1">
            分支
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              className="w-20 px-1.5 py-0.5 rounded border border-border bg-background text-text-regular text-xs outline-none focus:border-primary"
            />
          </label>
          {directSkill && (
            <span className="text-primary font-medium flex items-center gap-1">
              <ChevronIcon size={10} open />
              {directPath || directSkill}
            </span>
          )}
        </div>
      )}

      {error && <div className="mb-3 p-2 rounded-lg bg-danger/10 text-[13px] text-danger">{error}</div>}

      {skills && (
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
          {skills.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              该仓库没有找到 skills。<br />
              确保仓库结构为 <code className="text-primary">skills/&lt;name&gt;/SKILL.md</code> 或仓库根目录包含 <code className="text-primary">SKILL.md</code>。
            </div>
          ) : skills.map(skill => (
            <div key={skill.name} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{skill.name}</div>
                <div className="text-xs text-text-muted truncate">{skill.description}</div>
              </div>
              <Button variant="outline" size="sm" onPress={() => handleInstall(skill)} isDisabled={installing === skill.name}>
                <DownloadIcon size={12} /> {installing === skill.name ? '安装中...' : '安装'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-3">
        <Button variant="outline" onPress={onClose}>关闭</Button>
      </div>
    </div>
  )
}


// ─── 主页面 ───
export default function Skills() {
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detailSkill, setDetailSkill] = useState<SkillDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [remoteOpen, setRemoteOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await skillApi.list()
      setSkills(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function openDetail(name: string) {
    try {
      const detail = await skillApi.get(name)
      setDetailSkill(detail)
      setDetailOpen(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载失败')
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createName) return
    setSubmitting(true)
    try {
      await skillApi.create({ name: createName, description: createDesc })
      setCreateOpen(false)
      setCreateName('')
      setCreateDesc('')
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(skill: SkillSummary) {
    if (!confirm(`确认删除 Skill「${skill.name}」及其所有文件？`)) return
    try {
      await skillApi.delete(skill.name)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  async function handleToggle(skill: SkillSummary) {
    try {
      await skillApi.toggle(skill.name, !skill.isActive)
      await refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-2">
          <Button variant="outline" onPress={() => setRemoteOpen(true)}>
            <DownloadIcon size={16} /> 从远程安装
          </Button>
        </div>
        <Button variant="primary" onPress={() => setCreateOpen(true)}>
          <PlusIcon size={16} /> 新建 Skill
        </Button>
      </div>

      {error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button variant="ghost" onPress={refresh}>重新加载</Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[18px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="default" className="p-5"><div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-4 w-full rounded" />)}</div></Card>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light mb-4"><SparklesIcon size={28} /></div>
          <p className="text-sm text-text-regular mb-4">还没有任何 Skill</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onPress={() => setRemoteOpen(true)}><DownloadIcon size={14} /> 从远程安装</Button>
            <Button variant="primary" onPress={() => setCreateOpen(true)}><PlusIcon size={14} /> 新建</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[18px]">
          {skills.map(skill => (
            <Card key={skill.name} variant="default" className="flex flex-col overflow-hidden transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:border-primary/30">
              <div className="flex items-start gap-3.5 p-5 pb-4">
                <div className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}><SparklesIcon size={22} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-text-primary m-0 truncate">{skill.name}</h3>
                    <Chip color={sourceColor(skill.source)} size="sm" variant="soft">{skill.source === 'remote' ? '远程' : '本地'}</Chip>
                  </div>
                  <div className="text-xs text-text-muted line-clamp-2">{skill.description || '(无描述)'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 pb-4 text-xs text-text-muted">
                <span>{skill.fileCount} 个文件</span>
                {skill.repoOwner && <span>{skill.repoOwner}/{skill.repoName}</span>}
              </div>
              <div className="mt-auto flex items-center gap-2 px-5 py-3.5 border-t border-border bg-background">
                <Button variant="outline" size="sm" onPress={() => openDetail(skill.name)}>浏览</Button>
                <Toggle isSelected={skill.isActive} onChange={() => handleToggle(skill)} />
                <Button variant="danger-soft" size="sm" onPress={() => handleDelete(skill)} className="ml-auto"><TrashIcon /> 删除</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 详情 Modal */}
      <Modal isOpen={detailOpen} onOpenChange={setDetailOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="modal-wide">
              <Modal.Header>
                <h3 className="text-base font-bold text-text-primary m-0">{detailSkill?.name ?? ''}</h3>
              </Modal.Header>
              <Modal.Body>
                {detailSkill && <SkillDetailPanel skill={detailSkill} onClose={() => setDetailOpen(false)} />}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* 新建 Modal */}
      <Modal isOpen={createOpen} onOpenChange={setCreateOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header><h3 className="text-base font-bold text-text-primary m-0">新建 Skill</h3></Modal.Header>
              <Modal.Body>
                <form onSubmit={handleCreate}>
                  <div className="mb-4">
                    <label className={labelClass}>名称（目录名）</label>
                    <Input variant="primary" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="如：my-skill" autoFocus required fullWidth />
                  </div>
                  <div className="mb-4">
                    <label className={labelClass}>描述</label>
                    <Input variant="primary" value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="简短描述" fullWidth />
                  </div>
                  <p className="text-xs text-text-muted mb-6">创建后会生成 <code>{'{name}/SKILL.md'}</code> 目录结构，可在详情页编辑文件和添加 references 等子目录</p>
                  <div className="flex justify-end gap-2.5">
                    <Button variant="outline" onPress={() => setCreateOpen(false)}>取消</Button>
                    <Button type="submit" variant="primary" isDisabled={submitting || !createName}>{submitting ? '创建中...' : '创建'}</Button>
                  </div>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* 远程安装 Modal */}
      <Modal isOpen={remoteOpen} onOpenChange={setRemoteOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="modal-medium">
              <Modal.Header><h3 className="text-base font-bold text-text-primary m-0">从 GitHub 安装 Skill</h3></Modal.Header>
              <Modal.Body>
                <RemoteInstallPanel onClose={() => setRemoteOpen(false)} onInstalled={refresh} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}
