import { Button, Card, Skeleton } from "@heroui/react";
import type { UsageOverview } from "../../api/usage";
import { formatLatency, formatTokens, formatUsd } from "./usage-format";

export type ResourceState<T> =
  | { status: "loading"; data?: T }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

interface UsageMetricsProps {
  state: ResourceState<UsageOverview>;
  onRetry: () => void;
}

export default function UsageMetrics({ state, onRetry }: UsageMetricsProps) {
  if (state.status === "loading") {
    return (
      <div className="mb-5 flex flex-wrap gap-2.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} variant="default" className="w-[132px] border border-border bg-card-bg p-3 shadow-sm">
            <Skeleton className="h-11 w-full rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <Card role="alert" variant="default" className="mb-5 p-5">
        <p className="mb-3 text-sm text-danger">{state.message}</p>
        <Button size="sm" variant="outline" onPress={onRetry}>
          重试
        </Button>
      </Card>
    );
  }

  const metrics = [
    { label: "总调用", value: state.data.totalRuns.toLocaleString() },
    { label: "成功率", value: `${(state.data.successRate * 100).toFixed(1)}%` },
    { label: "输入 Token", value: formatTokens(state.data.inputTokens) },
    { label: "输出 Token", value: formatTokens(state.data.outputTokens) },
    { label: "估算费用", value: formatUsd(Number(state.data.estimatedCost)) },
    { label: "平均延迟", value: formatLatency(state.data.averageLatencyMs) }
  ];

  return (
    <section aria-label="关键指标" className="mb-5 flex flex-wrap gap-2.5">
      {metrics.map(metric => (
        <Card key={metric.label} variant="default" className="w-[132px] border border-border bg-card-bg p-3 shadow-sm">
          <p className="mb-1 text-xs font-semibold text-text-regular">{metric.label}</p>
          <p className="text-lg font-bold tabular-nums leading-tight text-text-primary">{metric.value}</p>
        </Card>
      ))}
    </section>
  );
}
