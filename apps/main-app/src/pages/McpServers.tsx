import { useState, useEffect, useCallback } from "react";
import { mcpApi, type McpServer, type CreateMcpServerInput, type McpTestResult } from "../api/mcp";
import { Button, Card, Chip, Input, Modal, Skeleton, Switch, TextArea } from "@heroui/react";

// ─── 内联 SVG 图标 ───
const ic = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function EditIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}
function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function PlugIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  );
}
function RefreshIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
function XCircleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

const labelClass = "block mb-1.5 text-[13px] font-medium text-text-regular";

function Toggle({
  isSelected,
  onChange,
  size = "sm"
}: {
  isSelected: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Switch isSelected={isSelected} onChange={onChange} size={size}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

// ─── 传输类型标签颜色 ───
function transportColor(t: string): "accent" | "success" | "warning" {
  switch (t) {
    case "stdio":
      return "accent";
    case "http":
      return "success";
    case "sse":
      return "warning";
    default:
      return "accent";
  }
}

// ─── 服务器表单 ───
function ServerForm({
  initial,
  onSubmit,
  onCancel,
  submitting
}: {
  initial?: McpServer;
  onSubmit: (data: CreateMcpServerInput) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [identifier, setIdentifier] = useState(initial?.identifier ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [transport, setTransport] = useState(initial?.transport ?? "stdio");
  const [command, setCommand] = useState(initial?.command ?? "");
  const [argsText, setArgsText] = useState((initial?.args ?? []).join("\n"));
  const [envText, setEnvText] = useState(
    Object.entries(initial?.env ?? {})
      .map(([k, v]) => `${k}=${v}`)
      .join("\n")
  );
  const [url, setUrl] = useState(initial?.url ?? "");
  const [headersText, setHeadersText] = useState(
    Object.entries(initial?.headers ?? {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const args = argsText
      .split("\n")
      .map(a => a.trim())
      .filter(Boolean);
    const env: Record<string, string> = {};
    for (const line of envText.split("\n")) {
      const m = line.match(/^(\w+)=(.*)$/);
      if (m) env[m[1]] = m[2];
    }
    const headers: Record<string, string> = {};
    for (const line of headersText.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }

    onSubmit({
      name,
      identifier,
      description: description || undefined,
      transport,
      command: transport === "stdio" ? command || undefined : undefined,
      args: transport === "stdio" ? args : undefined,
      env: transport === "stdio" ? env : undefined,
      url: transport !== "stdio" ? url || undefined : undefined,
      headers: transport !== "stdio" ? headers : undefined,
      isActive
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className={labelClass}>名称</label>
        <Input
          variant="primary"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="如：GitHub MCP"
          autoFocus
          required
          fullWidth
        />
      </div>
      <div className="mb-4">
        <label className={labelClass}>唯一标识</label>
        <Input
          variant="primary"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder="如：github"
          required
          fullWidth
        />
      </div>
      <div className="mb-4">
        <label className={labelClass}>描述</label>
        <Input
          variant="primary"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="可选"
          fullWidth
        />
      </div>
      <div className="mb-4">
        <label className={labelClass}>连接类型</label>
        <div className="flex gap-2">
          {["stdio", "http", "sse"].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTransport(t)}
              className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                transport === t
                  ? "bg-primary text-white"
                  : "bg-background border border-border text-text-regular hover:border-primary/30"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {transport === "stdio" ? (
        <>
          <div className="mb-4">
            <label className={labelClass}>Command</label>
            <Input
              variant="primary"
              value={command}
              onChange={e => setCommand(e.target.value)}
              placeholder="如：npx"
              fullWidth
            />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Args（每行一个）</label>
            <TextArea
              variant="primary"
              value={argsText}
              onChange={e => setArgsText(e.target.value)}
              placeholder={"-y\n@modelcontextprotocol/server-github"}
              rows={3}
              fullWidth
            />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Env（KEY=value 格式，每行一个）</label>
            <TextArea
              variant="primary"
              value={envText}
              onChange={e => setEnvText(e.target.value)}
              placeholder={"GITHUB_TOKEN=ghp_xxx"}
              rows={3}
              fullWidth
            />
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className={labelClass}>URL</label>
            <Input
              variant="primary"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/mcp"
              fullWidth
            />
          </div>
          <div className="mb-4">
            <label className={labelClass}>Headers（Key: Value 格式，每行一个）</label>
            <TextArea
              variant="primary"
              value={headersText}
              onChange={e => setHeadersText(e.target.value)}
              placeholder={"Authorization: Bearer xxx"}
              rows={3}
              fullWidth
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-6">
        <label className="text-[13px] font-medium text-text-regular">启用</label>
        <Toggle isSelected={isActive} onChange={setIsActive} />
      </div>
      <div className="flex justify-end gap-2.5">
        <Button variant="outline" onPress={onCancel}>
          取消
        </Button>
        <Button type="submit" variant="primary" isDisabled={submitting || !name || !identifier}>
          {submitting ? "保存中..." : "确定"}
        </Button>
      </div>
    </form>
  );
}

// ─── 工具列表展示 ───
function ToolsPanel({ server, onClose }: { server: McpServer; onClose: () => void }) {
  const [tools, setTools] = useState<unknown[]>(server.cachedTools ?? []);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<McpTestResult | null>(null);

  async function handleSync() {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await mcpApi.syncTools(server.id);
      if (result.success && result.tools) {
        setTools(result.tools);
        setTestResult({ success: true, tools: result.tools as McpTestResult["tools"] });
      } else {
        setTestResult({ success: false, error: result.error });
      }
    } catch (err) {
      setTestResult({ success: false, error: err instanceof Error ? err.message : "同步失败" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-text-muted">
          {Array.isArray(tools) ? tools.length : 0} 个工具
          {server.lastSyncAt && ` (上次同步: ${new Date(server.lastSyncAt).toLocaleString()})`}
        </span>
        <Button variant="outline" size="sm" onPress={handleSync} isDisabled={testing}>
          <RefreshIcon /> {testing ? "同步中..." : "同步工具"}
        </Button>
      </div>

      {testResult && !testResult.success && (
        <div className="mb-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-[13px] text-danger flex items-center gap-2">
          <XCircleIcon /> {testResult.error}
        </div>
      )}

      {Array.isArray(tools) && tools.length > 0 ? (
        <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
          {tools.map((tool: any, i: number) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-background">
              <div className="text-sm font-medium text-text-primary mb-1">{tool.name}</div>
              <div className="text-xs text-text-muted">{tool.description}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-sm text-text-muted">暂无工具，点击「同步工具」从 MCP Server 获取</div>
      )}

      <div className="flex justify-end mt-6">
        <Button variant="outline" onPress={onClose}>
          关闭
        </Button>
      </div>
    </div>
  );
}

// ─── 主页面 ───
export default function McpServers() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<McpServer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toolsServer, setToolsServer] = useState<McpServer | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await mcpApi.listServers();
      setServers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(s: McpServer) {
    setEditing(s);
    setModalOpen(true);
  }

  async function handleSubmit(data: CreateMcpServerInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await mcpApi.updateServer(editing.id, data);
      } else {
        await mcpApi.createServer(data);
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(s: McpServer) {
    if (!confirm(`确认删除 MCP Server「${s.name}」？`)) return;
    try {
      await mcpApi.deleteServer(s.id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function handleToggle(s: McpServer) {
    try {
      await mcpApi.updateServer(s.id, { isActive: !s.isActive });
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <Button variant="primary" size="md" onPress={openCreate}>
          <PlusIcon size={16} /> 新增 MCP Server
        </Button>
      </div>

      {error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button variant="ghost" onPress={refresh}>
            重新加载
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[18px]">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} variant="default" className="p-5">
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full rounded" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light mb-4">
            <PlugIcon size={28} />
          </div>
          <p className="text-sm text-text-regular mb-4">还没有配置任何 MCP Server</p>
          <Button variant="primary" size="sm" onPress={openCreate}>
            <PlusIcon size={14} /> 添加第一个 MCP Server
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[18px]">
          {servers.map(s => (
            <Card
              key={s.id}
              variant="default"
              className="flex flex-col overflow-hidden transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:border-primary/30"
            >
              <div className="flex items-start gap-3.5 p-5 pb-4">
                <div
                  className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                >
                  <PlugIcon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-text-primary m-0 truncate">{s.name}</h3>
                    <Chip color={transportColor(s.transport)} size="sm" variant="soft">
                      {s.transport}
                    </Chip>
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {s.transport === "stdio" ? `${s.command} ${s.args.join(" ")}` : s.url || "—"}
                  </div>
                </div>
                <Chip color={s.isActive ? "success" : "default"} variant="soft" size="sm">
                  {s.isActive ? "启用" : "禁用"}
                </Chip>
              </div>

              <div className="flex items-center gap-4 px-5 pb-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-text-regular">
                    {Array.isArray(s.cachedTools) ? s.cachedTools.length : 0}
                  </span>
                  个工具
                </span>
                <span>{s.identifier}</span>
              </div>

              <div className="mt-auto flex items-center gap-2 px-5 py-3.5 border-t border-border bg-background">
                <Button variant="outline" size="sm" onPress={() => setToolsServer(s)}>
                  工具
                </Button>
                <Button variant="outline" size="sm" onPress={() => openEdit(s)}>
                  <EditIcon /> 编辑
                </Button>
                <Toggle isSelected={s.isActive} onChange={() => handleToggle(s)} />
                <Button variant="danger-soft" size="sm" onPress={() => handleDelete(s)} className="ml-auto">
                  <TrashIcon /> 删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="modal-medium">
              <Modal.Header>
                <h3 className="text-base font-bold text-text-primary m-0">
                  {editing ? "编辑 MCP Server" : "新增 MCP Server"}
                </h3>
              </Modal.Header>
              <Modal.Body>
                <ServerForm
                  initial={editing ?? undefined}
                  onSubmit={handleSubmit}
                  onCancel={() => setModalOpen(false)}
                  submitting={submitting}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={!!toolsServer} onOpenChange={open => !open && setToolsServer(null)}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="modal-medium">
              <Modal.Header>
                <h3 className="text-base font-bold text-text-primary m-0">
                  工具列表{toolsServer ? " - " + toolsServer.name : ""}
                </h3>
              </Modal.Header>
              <Modal.Body>
                {toolsServer && <ToolsPanel server={toolsServer} onClose={() => setToolsServer(null)} />}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
