import { Button, Card, Skeleton } from "@heroui/react";
import type {
  UsageBreakdown,
  UsageDimensionBreakdownItem,
  UsageFailureAttemptBreakdownItem,
  UsageFallbackBreakdownItem
} from "../../api/usage";
import { formatTokens, formatUsd } from "./usage-format";
import type { ResourceState } from "./UsageMetrics";

interface UsageBreakdownsProps {
  state: ResourceState<UsageBreakdown>;
  onRetry: () => void;
}

type BreakdownGroup = {
  title: string;
  items: UsageDimensionBreakdownItem[];
};

function BreakdownBars({ title, items }: BreakdownGroup) {
  const maxRuns = Math.max(...items.map(item => item.runs), 1);

  return (
    <Card variant="default" className="h-full border border-border bg-card-bg p-5 shadow-sm">
      <h3 className="mb-4 mt-0 text-sm font-bold text-text-primary">{title}</h3>
      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-text-muted">暂无数据</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map(item => (
            <li key={item.id} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-text-regular">{item.name}</span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-text-regular">
                  {item.runs.toLocaleString()} 次
                </span>
              </div>
              <div aria-hidden="true" className="mb-1 h-1.5 overflow-hidden rounded-full bg-border/80">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max((item.runs / maxRuns) * 100, 2)}%` }}
                />
              </div>
              <div className="flex justify-between gap-2 text-xs text-text-regular">
                <span>
                  Token {formatTokens(item.inputTokens + item.outputTokens)} · 输入 {formatTokens(item.inputTokens)} /
                  输出 {formatTokens(item.outputTokens)}
                </span>
                <span>{formatUsd(Number(item.estimatedCost))}</span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function FailureAttemptBars({ items }: { items: UsageFailureAttemptBreakdownItem[] }) {
  const maxAttempts = Math.max(...items.map(item => item.attemptCount), 1);

  return (
    <Card variant="default" className="h-full border border-border bg-card-bg p-5 shadow-sm">
      <h3 className="mb-4 mt-0 text-sm font-bold text-text-primary">失败尝试排行</h3>
      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-text-muted">暂无数据</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map(item => (
            <li key={`${item.errorType}-${item.providerId}`} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-text-regular">
                  {item.errorType} · {item.providerName}
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-text-regular">
                  {item.attemptCount.toLocaleString()} 次
                </span>
              </div>
              <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-border/80">
                <div
                  className="h-full rounded-full bg-danger"
                  style={{ width: `${Math.max((item.attemptCount / maxAttempts) * 100, 2)}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function FallbackBars({ items }: { items: UsageFallbackBreakdownItem[] }) {
  const maxFallbacks = Math.max(...items.map(item => item.fallbackCount), 1);

  return (
    <Card variant="default" className="h-full border border-border bg-card-bg p-5 shadow-sm">
      <h3 className="mb-4 mt-0 text-sm font-bold text-text-primary">Fallback 排行</h3>
      {items.length === 0 ? (
        <p className="m-0 text-[13px] text-text-muted">暂无数据</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map(item => (
            <li key={item.deploymentId} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-text-regular">
                  {item.deploymentName} · {item.upstreamModel}
                </span>
                <span className="shrink-0 text-xs font-medium tabular-nums text-text-regular">
                  {item.fallbackCount.toLocaleString()} 次
                </span>
              </div>
              <div aria-hidden="true" className="mb-1 h-1.5 overflow-hidden rounded-full bg-border/80">
                <div
                  className="h-full rounded-full bg-warning"
                  style={{ width: `${Math.max((item.fallbackCount / maxFallbacks) * 100, 2)}%` }}
                />
              </div>
              <p className="m-0 text-xs text-text-regular">{item.providerName}</p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export default function UsageBreakdowns({ state, onRetry }: UsageBreakdownsProps) {
  if (state.status === "loading") {
    return (
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <Card key={index} variant="default" className="p-5">
            <Skeleton className="h-44 w-full rounded" />
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

  const groups: BreakdownGroup[] = [
    { title: "来源应用排行", items: state.data.applications.slice(0, 10) },
    { title: "Virtual Model 排行", items: state.data.virtualModels.slice(0, 10) },
    { title: "Provider 排行", items: state.data.providers.slice(0, 10) }
  ];

  return (
    <div className="mb-5 space-y-4">
      <section aria-labelledby="usage-dimension-heading">
        <h2 id="usage-dimension-heading" className="mb-3 mt-0 text-sm font-bold text-text-primary">
          业务维度
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {groups.map(group => (
            <BreakdownBars key={group.title} title={group.title} items={group.items} />
          ))}
        </div>
      </section>
      <section aria-labelledby="usage-stability-heading">
        <h2 id="usage-stability-heading" className="mb-3 mt-0 text-sm font-bold text-text-primary">
          稳定性
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FailureAttemptBars items={state.data.failureAttempts.slice(0, 10)} />
          <FallbackBars items={state.data.fallbacks.slice(0, 10)} />
        </div>
      </section>
    </div>
  );
}
