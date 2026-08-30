import { useState, useEffect, useCallback } from "react";
import { llmApi, type LlmProvider, type LlmModel, type CreateProviderInput } from "../api/llm";
import { Button, Card, Chip, Input, ListBox, Select, Skeleton, Switch } from "@heroui/react";
import AiCenterModal from "../components/AiCenterModal";

const SKELETON_IDS = ["skeleton-1", "skeleton-2", "skeleton-3"];

// ─── 内联 SVG 图标（lucide 风格） ───
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
function ServerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...ic}>
      <rect width="20" height="8" x="2" y="2" rx="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" />
      <path d="M6 6h.01M6 18h.01" />
    </svg>
  );
}

// ─── 类型 → 标签颜色映射 ───
function typeChipColor(type: string): "accent" | "default" {
  switch (type) {
    case "openai":
      return "accent";
    case "ollama":
      return "default";
    default:
      return "default";
  }
}

// ─── 输入框标签样式 ───
const labelClass = "block mb-1.5 text-[13px] font-medium text-text-regular";

// ─── 复用 Switch 组件（HeroUI v3 复合组件） ───
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

// ─── 提供商表单 ───
function ProviderForm({
  initial,
  types,
  onSubmit
}: {
  initial?: LlmProvider;
  types: string[];
  onSubmit: (data: CreateProviderInput) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? types[0] ?? "openai");
  const [baseUrl, setBaseUrl] = useState(initial?.baseUrl ?? "");
  const [apiKey, setApiKey] = useState(initial?.apiKey ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name, type, baseUrl: baseUrl || undefined, apiKey: apiKey || undefined, isActive });
  }

  return (
    <form id="provider-form" onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className={labelClass}>名称</label>
        <Input
          variant="primary"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="如：OpenAI 官方"
          autoFocus
          required
          fullWidth
        />
      </div>
      <div className="mb-4">
        <label className={labelClass}>供应商类型</label>
        <Select selectedKey={type} onSelectionChange={key => key && setType(String(key))} fullWidth>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {types.map(t => (
                <ListBox.Item key={t} id={t}>
                  {t}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      <div className="mb-4">
        <label className={labelClass}>Base URL</label>
        <Input
          variant="primary"
          value={baseUrl}
          onChange={e => setBaseUrl(e.target.value)}
          placeholder="如：https://api.openai.com/v1"
          fullWidth
        />
      </div>
      <div className="mb-4">
        <label className={labelClass}>API Key</label>
        <Input
          variant="primary"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-..."
          fullWidth
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-medium text-text-regular">启用</label>
        <Toggle isSelected={isActive} onChange={setIsActive} />
      </div>
    </form>
  );
}

// ─── 模型管理 ───
function ModelManager({
  provider,
  onModelsChange
}: {
  provider: LlmProvider;
  onModelsChange: (models: LlmModel[]) => void;
}) {
  const models = provider.models;
  const [newModelName, setNewModelName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newModelName) return;
    setAdding(true);
    try {
      const created = await llmApi.createModel(provider.id, {
        modelName: newModelName,
        displayName: newDisplayName || undefined
      });
      setNewModelName("");
      setNewDisplayName("");
      onModelsChange([...models, created]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "添加失败");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(model: LlmModel) {
    if (!confirm(`确认删除模型「${model.displayName ?? model.modelName}」？`)) return;
    try {
      await llmApi.deleteModel(model.id);
      onModelsChange(models.filter(item => item.id !== model.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function handleToggle(model: LlmModel) {
    try {
      const updated = await llmApi.updateModel(model.id, { isActive: !model.isActive });
      onModelsChange(models.map(item => (item.id === updated.id ? updated : item)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    }
  }

  return (
    <div>
      {/* 新增模型 */}
      <form onSubmit={handleAdd} className="mb-5">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input
            variant="primary"
            value={newModelName}
            onChange={e => setNewModelName(e.target.value)}
            placeholder="模型标识，如 gpt-4o"
            fullWidth
          />
          <Input
            variant="primary"
            value={newDisplayName}
            onChange={e => setNewDisplayName(e.target.value)}
            placeholder="显示名（可选）"
            fullWidth
          />
        </div>
        <Button type="submit" variant="primary" isDisabled={adding || !newModelName} fullWidth>
          <PlusIcon size={14} /> 添加
        </Button>
      </form>

      {/* 模型列表 */}
      {models.length === 0 ? (
        <div className="py-10 text-center text-sm text-text-muted">暂无模型，请添加</div>
      ) : (
        <div className="flex flex-col gap-2">
          {models.map(model => (
            <div
              key={model.id}
              className="flex items-center gap-3 py-2.5 px-3.5 rounded-lg border border-border bg-background"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary">{model.displayName ?? model.modelName}</div>
                <div className="text-xs text-text-muted">{model.modelName}</div>
              </div>
              <Chip color={model.isActive ? "success" : "default"} size="sm" variant="soft">
                {model.isActive ? "启用" : "禁用"}
              </Chip>
              <Toggle isSelected={model.isActive} onChange={() => handleToggle(model)} />
              <Button
                variant="danger-soft"
                isIconOnly
                size="sm"
                onPress={() => handleDelete(model)}
                aria-label="删除模型"
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 主页面 ───
export default function LlmProviders() {
  const [providers, setProviders] = useState<LlmProvider[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LlmProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modelProvider, setModelProvider] = useState<LlmProvider | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [list, t] = await Promise.all([llmApi.listProviders(), llmApi.getTypes()]);
      setProviders(list);
      setTypes(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(provider: LlmProvider) {
    setEditing(provider);
    setModalOpen(true);
  }

  async function handleSubmit(data: CreateProviderInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await llmApi.updateProvider(editing.id, data);
      } else {
        await llmApi.createProvider(data);
      }
      setModalOpen(false);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(provider: LlmProvider) {
    if (!confirm(`确认删除提供商「${provider.name}」及其所有模型？`)) return;
    try {
      await llmApi.deleteProvider(provider.id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  function openModels(provider: LlmProvider) {
    setModelProvider(provider);
  }

  function handleModelsChange(providerId: string, models: LlmModel[]) {
    setProviders(current => current.map(provider => (provider.id === providerId ? { ...provider, models } : provider)));
    setModelProvider(current => (current?.id === providerId ? { ...current, models } : current));
  }

  return (
    <div>
      {/* 操作栏 */}
      <div className="flex justify-end mb-5">
        <Button variant="primary" size="md" onPress={openCreate}>
          <PlusIcon size={16} /> 新增提供商
        </Button>
      </div>

      {/* 内容 */}
      {error ? (
        <div className="py-16 text-center">
          <p className="text-sm text-danger mb-3">{error}</p>
          <Button variant="ghost" onPress={refresh}>
            重新加载
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[18px]">
          {SKELETON_IDS.map(cardId => (
            <Card key={cardId} variant="default" className="p-5">
              <div className="flex flex-col gap-3">
                {SKELETON_IDS.map(lineId => (
                  <Skeleton key={lineId} className="h-4 w-full rounded" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-light mb-4">
            <ServerIcon size={28} />
          </div>
          <p className="text-sm text-text-regular mb-4">还没有配置任何 Provider</p>
          <Button variant="primary" size="sm" onPress={openCreate}>
            <PlusIcon size={14} /> 添加第一个提供商
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-[18px]">
          {providers.map(provider => (
            <Card
              key={provider.id}
              variant="default"
              className="flex flex-col overflow-hidden transition-all hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)] hover:border-primary/30"
            >
              {/* 卡片头部 */}
              <div className="flex items-start gap-3.5 p-5 pb-4">
                <div
                  className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center shrink-0"
                  style={{
                    background: "var(--primary-light)",
                    color: "var(--primary)"
                  }}
                >
                  <ServerIcon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-bold text-text-primary m-0 truncate">{provider.name}</h3>
                    <Chip color={typeChipColor(provider.type)} size="sm" variant="soft">
                      {provider.type}
                    </Chip>
                  </div>
                  <div className="text-xs text-text-muted truncate">{provider.baseUrl || "—"}</div>
                </div>
                {/* 状态指示 */}
                <Chip color={provider.isActive ? "success" : "default"} variant="soft" size="sm">
                  {provider.isActive ? "启用" : "禁用"}
                </Chip>
              </div>

              {/* 元信息 */}
              <div className="flex items-center gap-4 px-5 pb-4 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="font-bold text-text-regular">{provider.models.length}</span>
                  个模型
                </span>
                <span>
                  API Key:{" "}
                  {provider.apiKey ? (
                    <span className="text-success font-medium">已配置</span>
                  ) : (
                    <span className="text-text-muted">未配置</span>
                  )}
                </span>
              </div>

              {/* 操作栏 */}
              <div className="mt-auto flex items-center gap-2 px-5 py-3.5 border-t border-border bg-background">
                <Button variant="outline" size="sm" onPress={() => openModels(provider)}>
                  模型
                </Button>
                <Button variant="outline" size="sm" onPress={() => openEdit(provider)}>
                  <EditIcon /> 编辑
                </Button>
                <Button variant="danger-soft" size="sm" onPress={() => handleDelete(provider)} className="ml-auto">
                  <TrashIcon /> 删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 新增/编辑对话框 */}
      <AiCenterModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "编辑提供商" : "新增提供商"}
        size="md"
        footer={
          <>
            <Button variant="tertiary" onPress={() => setModalOpen(false)}>
              取消
            </Button>
            <Button type="submit" form="provider-form" variant="primary" isDisabled={submitting}>
              {submitting ? "保存中..." : "确定"}
            </Button>
          </>
        }
      >
        <ProviderForm initial={editing ?? undefined} types={types} onSubmit={handleSubmit} />
      </AiCenterModal>

      {/* 模型管理对话框 */}
      <AiCenterModal
        isOpen={!!modelProvider}
        onOpenChange={open => !open && setModelProvider(null)}
        title={`管理模型${modelProvider ? ` - ${modelProvider.name}` : ""}`}
        size="md"
        footer={
          <Button variant="tertiary" onPress={() => setModelProvider(null)}>
            关闭
          </Button>
        }
      >
        {modelProvider && (
          <ModelManager
            provider={modelProvider}
            onModelsChange={models => handleModelsChange(modelProvider.id, models)}
          />
        )}
      </AiCenterModal>
    </div>
  );
}
