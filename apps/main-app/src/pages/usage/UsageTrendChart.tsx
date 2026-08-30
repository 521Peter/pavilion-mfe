import { useState } from "react";
import { Button, Card, Skeleton } from "@heroui/react";
import type { UsageTimeseriesPoint } from "../../api/usage";
import type { ResourceState } from "./UsageMetrics";
import { formatLocalTime, formatTokens, formatUsd } from "./usage-format";

type TrendMetric = "requests" | "tokens" | "cost";

interface UsageTrendChartProps {
  state: ResourceState<UsageTimeseriesPoint[]>;
  onRetry: () => void;
}

function metricValue(point: UsageTimeseriesPoint, metric: TrendMetric): number {
  if (metric === "requests") return point.totalRuns;
  if (metric === "cost") return Number(point.estimatedCost);
  return point.inputTokens + point.outputTokens + point.cachedTokens + point.reasoningTokens;
}

function formatMetric(value: number, metric: TrendMetric): string {
  if (metric === "cost") return formatUsd(value);
  if (metric === "tokens") return formatTokens(value);
  return value.toLocaleString();
}

export default function UsageTrendChart({ state, onRetry }: UsageTrendChartProps) {
  const [metric, setMetric] = useState<TrendMetric>("requests");
  const points = state.status === "success" ? state.data : [];
  const values = points.map(point => metricValue(point, metric));
  const maxValue = Math.max(...values, 1);
  const path = values
    .map((value, index) => {
      const x = index * (800 / Math.max(points.length - 1, 1));
      const y = 220 - (value / maxValue) * 200;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const tabs: Array<{ key: TrendMetric; label: string }> = [
    { key: "requests", label: "调用数" },
    { key: "tokens", label: "Token" },
    { key: "cost", label: "费用" }
  ];

  if (state.status === "loading") {
    return (
      <Card variant="default" className="p-5">
        <Skeleton className="h-64 w-full rounded" />
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card role="alert" variant="default" className="p-5">
        <h2 className="m-0 text-base font-bold text-text-primary">用量趋势</h2>
        <p className="mb-3 mt-2 text-sm text-danger">{state.message}</p>
        <Button size="sm" variant="outline" onPress={onRetry}>
          重试
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="default" className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-text-primary">用量趋势</h2>
          <p className="mt-1 text-[13px] text-text-muted">按选定时间范围内的 UTC 时间桶聚合</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="趋势指标">
          {tabs.map(tab => (
            <Button
              key={tab.key}
              size="sm"
              variant={metric === tab.key ? "primary" : "outline"}
              aria-pressed={metric === tab.key}
              onPress={() => setMetric(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <div className="flex h-60 items-center justify-center text-sm text-text-muted">当前范围内暂无趋势数据</div>
      ) : (
        <>
          <figure className="m-0">
            <svg
              viewBox="0 0 800 240"
              className="h-60 w-full"
              role="img"
              aria-label={`${tabs.find(tab => tab.key === metric)?.label}趋势折线图`}
            >
              <title>{`${tabs.find(tab => tab.key === metric)?.label}趋势`}</title>
              <desc>{`折线展示各时间桶的${tabs.find(tab => tab.key === metric)?.label}，数值摘要在图表下方。`}</desc>
              <line x1="0" y1="20" x2="800" y2="20" className="stroke-border" strokeDasharray="4 6" />
              <line x1="0" y1="120" x2="800" y2="120" className="stroke-border" strokeDasharray="4 6" />
              <line x1="0" y1="220" x2="800" y2="220" className="stroke-border" />
              <path
                d={path}
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="0" y="236" className="fill-text-muted" fontSize="12">
                {formatLocalTime(points[0]?.bucket)}
              </text>
              <text x="800" y="236" textAnchor="end" className="fill-text-muted" fontSize="12">
                {formatLocalTime(points[points.length - 1]?.bucket)}
              </text>
            </svg>
            <figcaption className="mt-1 text-xs text-text-muted">
              最大值 {formatMetric(maxValue === 1 && values.every(value => value < 1) ? 0 : maxValue, metric)}
            </figcaption>
          </figure>
          <ul className="mt-3 grid max-h-32 grid-cols-1 gap-1 overflow-auto text-xs text-text-regular sm:grid-cols-2 xl:grid-cols-3">
            {points.map(point => (
              <li key={point.bucket} className="flex justify-between gap-3 rounded px-1 py-0.5">
                <span className="truncate">{formatLocalTime(point.bucket)}</span>
                <span className="font-medium">{formatMetric(metricValue(point, metric), metric)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
