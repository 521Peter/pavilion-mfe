import { Button, Card, Skeleton } from "@heroui/react";
import { ArrowDownToLine, ArrowUpFromLine, CircleCheckBig, CircleDollarSign, Gauge, RadioTower } from "lucide-react";
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
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} variant="default" className="min-w-0 border border-border bg-card-bg p-4 shadow-sm">
            <Skeleton className="h-[72px] w-full rounded" />
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
    {
      label: "总调用",
      value: state.data.totalRuns.toLocaleString(),
      hint: `${state.data.failedRuns.toLocaleString()} 次失败`,
      icon: RadioTower,
      tone: "text-primary bg-primary-light"
    },
    {
      label: "成功率",
      value: `${(state.data.successRate * 100).toFixed(1)}%`,
      hint: `${state.data.completedRuns.toLocaleString()} 次成功`,
      icon: CircleCheckBig,
      tone: "text-success bg-success/10"
    },
    {
      label: "输入 Token",
      value: formatTokens(state.data.inputTokens),
      hint: `${formatTokens(state.data.cachedTokens)} 缓存`,
      icon: ArrowDownToLine,
      tone: "text-primary bg-primary-light"
    },
    {
      label: "输出 Token",
      value: formatTokens(state.data.outputTokens),
      hint: `${formatTokens(state.data.reasoningTokens)} 推理`,
      icon: ArrowUpFromLine,
      tone: "text-warning bg-warning/10"
    },
    {
      label: "估算费用",
      value: formatUsd(Number(state.data.estimatedCost)),
      hint: "按模型单价估算",
      icon: CircleDollarSign,
      tone: "text-success bg-success/10"
    },
    {
      label: "平均延迟",
      value: formatLatency(state.data.averageLatencyMs),
      hint: `${state.data.fallbackCount.toLocaleString()} 次 Fallback`,
      icon: Gauge,
      tone: "text-warning bg-warning/10"
    }
  ];

  return (
    <section aria-label="关键指标" className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {metrics.map(({ icon: Icon, ...metric }) => (
        <Card key={metric.label} variant="default" className="min-w-0 border border-border bg-card-bg p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="m-0 text-xs font-semibold text-text-regular">{metric.label}</p>
            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${metric.tone}`}>
              <Icon aria-hidden="true" className="size-4" />
            </span>
          </div>
          <p
            className="m-0 truncate text-xl font-bold tabular-nums leading-tight text-text-primary"
            title={metric.value}
          >
            {metric.value}
          </p>
          <p className="mb-0 mt-1.5 truncate text-xs text-text-regular" title={metric.hint}>
            {metric.hint}
          </p>
        </Card>
      ))}
    </section>
  );
}
