import { useState } from "react";
import { Button, Card, Chip, Skeleton } from "@heroui/react";
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

function UsageRunValues({ run }: { run: UsageRunItem }) {
  if (run.usageRecords.length === 0) return <span className="text-text-muted">-</span>;
  const inputTokens = run.usageRecords.reduce((total, record) => total + record.inputTokens, 0);
  const outputTokens = run.usageRecords.reduce((total, record) => total + record.outputTokens, 0);
  const estimatedCost = run.usageRecords.reduce((total, record) => total + Number(record.estimatedCost), 0);
  const latency = [...run.usageRecords].reverse().find(record => record.latencyMs !== null)?.latencyMs;

  return (
    <span>
      {formatTokens(inputTokens)} / {formatTokens(outputTokens)} · {formatUsd(estimatedCost)} · {formatLatency(latency)}
    </span>
  );
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
      className="max-w-40"
      size="sm"
      variant="ghost"
      aria-label={`复制请求 ID ${requestId}`}
      onPress={() => void copy()}
    >
      <span className="truncate font-mono">{copied ? "已复制" : requestId}</span>
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
            {data.page} / {data.totalPages}
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border bg-background/70 text-text-regular">
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  时间
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  请求 ID
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  状态
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  来源应用
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  调用身份
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  Virtual Model
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  Provider / 模型
                </th>
                <th scope="col" className="py-2.5 pr-3 font-medium">
                  用量
                </th>
                <th scope="col" className="py-2.5 font-medium">
                  Fallback
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map(run => {
                const usage = run.usageRecords[0];
                return (
                  <tr
                    key={run.id}
                    className="border-b border-border/70 align-top transition-colors hover:bg-background/80"
                  >
                    <td className="whitespace-nowrap py-3 pr-3">{formatLocalTime(run.createdAt)}</td>
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
                    <td className="py-3 pr-3">
                      <UsageRunValues run={run} />
                    </td>
                    <td className="py-3">{usage?.fallbackCount ?? 0}</td>
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
