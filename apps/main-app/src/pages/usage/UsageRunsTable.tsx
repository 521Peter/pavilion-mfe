import { useState } from "react";
import { Button, Card, Chip, Skeleton } from "@heroui/react";
import { Check, Copy } from "lucide-react";
import type { UsageRunItem, UsageRunPage } from "../../api/usage";
import { formatLatency, formatLocalTime, formatTokens, formatUsd } from "./usage-format";
import type { ResourceState } from "./UsageMetrics";

interface UsageRunsTableProps {
  state: ResourceState<UsageRunPage>;
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

function statusColor(status: string): "success" | "danger" | "warning" | "default" {
  if (status === "completed") return "success";
  if (status === "failed") return "danger";
  if (status === "cancelled") return "warning";
  return "default";
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    queued: "排队中",
    running: "执行中",
    completed: "成功",
    failed: "失败",
    cancelled: "已取消"
  };
  return labels[status] ?? status;
}

function usageRunValues(run: UsageRunItem) {
  if (run.usageRecords.length === 0) return null;
  const inputTokens = run.usageRecords.reduce((total, record) => total + record.inputTokens, 0);
  const outputTokens = run.usageRecords.reduce((total, record) => total + record.outputTokens, 0);
  const estimatedCost = run.usageRecords.reduce((total, record) => total + Number(record.estimatedCost), 0);
  const latency = [...run.usageRecords].reverse().find(record => record.latencyMs !== null)?.latencyMs;
  const fallbackCount = run.usageRecords.reduce((total, record) => total + record.fallbackCount, 0);
  return { inputTokens, outputTokens, estimatedCost, latency, fallbackCount };
}

function CopyRequestId({ requestId }: { requestId: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      className="max-w-40 justify-start px-2"
      size="sm"
      variant="ghost"
      aria-label={`复制请求 ID ${requestId}`}
      onPress={() => void copy()}
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3.5 text-success" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
      <span className="truncate font-mono">{copied ? "已复制" : requestId}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? "请求 ID 已复制" : ""}
      </span>
    </Button>
  );
}

export default function UsageRunsTable({ state, onPageChange, onRetry }: UsageRunsTableProps) {
  if (state.status === "loading") {
    return (
      <Card variant="default" className="p-5">
        <Skeleton className="h-72 w-full rounded" />
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card role="alert" variant="default" className="p-5">
        <p className="mb-3 text-sm text-danger">{state.message}</p>
        <Button size="sm" variant="outline" onPress={onRetry}>
          重试
        </Button>
      </Card>
    );
  }

  const data = state.data;

  return (
    <Card variant="default" className="border border-border bg-card-bg p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-text-primary">调用明细</h2>
          <p className="mt-1 text-[13px] text-text-regular">共 {data.total.toLocaleString()} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" isDisabled={data.page <= 1} onPress={() => onPageChange(data.page - 1)}>
            上一页
          </Button>
          <span className="text-[13px] tabular-nums text-text-regular">
            第 {data.page} / {Math.max(data.totalPages, 1)} 页
          </span>
          <Button
            size="sm"
            variant="outline"
            isDisabled={data.page >= data.totalPages}
            onPress={() => onPageChange(data.page + 1)}
          >
            下一页
          </Button>
        </div>
      </div>

      {data.items.length === 0 ? (
        <p className="m-0 py-10 text-center text-sm text-text-muted">当前条件下暂无调用明细</p>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[1180px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-background text-text-regular">
                <th scope="col" className="sticky top-0 z-10 py-2.5 pl-3 pr-3 font-semibold">
                  时间
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  请求 ID
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  状态
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  来源应用
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  调用身份
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  Virtual Model
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  Provider / 模型
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  Token（输入 / 输出）
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  费用
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  延迟
                </th>
                <th scope="col" className="sticky top-0 z-10 py-2.5 pr-3 font-semibold">
                  Fallback
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(run => {
                const usage = run.usageRecords[0];
                const values = usageRunValues(run);
                return (
                  <tr
                    key={run.id}
                    className="border-b border-border/70 align-top transition-colors hover:bg-background/80"
                  >
                    <td className="whitespace-nowrap py-3 pl-3 pr-3">{formatLocalTime(run.createdAt)}</td>
                    <td className="py-3 pr-3">
                      <CopyRequestId requestId={run.requestId} />
                    </td>
                    <td className="py-3 pr-3">
                      <Chip color={statusColor(run.status)} size="sm" variant="soft">
                        {statusLabel(run.status)}
                      </Chip>
                    </td>
                    <td className="py-3 pr-3">{run.application?.name ?? "-"}</td>
                    <td className="py-3 pr-3">{run.user?.nickname || run.user?.username || "-"}</td>
                    <td className="py-3 pr-3">{run.virtualModel?.displayName || run.virtualModel?.name || "-"}</td>
                    <td className="py-3 pr-3">
                      {usage?.deployment
                        ? `${usage.deployment.provider.name} / ${usage.deployment.upstreamModel}`
                        : "-"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 font-medium tabular-nums">
                      {values ? `${formatTokens(values.inputTokens)} / ${formatTokens(values.outputTokens)}` : "-"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 font-medium tabular-nums">
                      {values ? formatUsd(values.estimatedCost) : "-"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 tabular-nums">
                      {values ? formatLatency(values.latency) : "-"}
                    </td>
                    <td className="py-3 pr-3 tabular-nums">{values?.fallbackCount ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
