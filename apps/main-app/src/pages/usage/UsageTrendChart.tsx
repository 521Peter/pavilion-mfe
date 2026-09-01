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
  return point.inputTokens + point.outputTokens;
}

function formatMetric(value: number, metric: TrendMetric): string {
  if (metric === "cost") return formatUsd(value);
  if (metric === "tokens") return formatTokens(value);
  return value.toLocaleString();
}

export default function UsageTrendChart({ state, onRetry }: UsageTrendChartProps) {
  const [metric, setMetric] = useState<TrendMetric>("requests");
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
  const points = state.status === "success" ? state.data : [];
  const values = points.map(point => metricValue(point, metric));
  const actualMaxValue = Math.max(...values, 0);
  const scaleMaxValue = Math.max(actualMaxValue, 1);
  const plot = { left: 72, right: 784, top: 20, bottom: 210 };
  const coordinates = values.map((value, index) => ({
    x:
      points.length === 1
        ? (plot.left + plot.right) / 2
        : plot.left + index * ((plot.right - plot.left) / Math.max(points.length - 1, 1)),
    y: plot.bottom - (value / scaleMaxValue) * (plot.bottom - plot.top)
  }));
  const path =
    coordinates.length === 1
      ? `M${plot.left},${coordinates[0].y.toFixed(2)} L${plot.right},${coordinates[0].y.toFixed(2)}`
      : coordinates
          .map((value, index) => {
            return `${index === 0 ? "M" : "L"}${value.x.toFixed(2)},${value.y.toFixed(2)}`;
          })
          .join(" ");
  const areaPath = path ? `${path} L${plot.right},${plot.bottom} L${plot.left},${plot.bottom} Z` : "";
  const totalValue = values.reduce((total, value) => total + value, 0);
  const averageValue = totalValue / Math.max(values.length, 1);
  const activePoint = activePointIndex === null ? null : points[activePointIndex];
  const activeCoordinate = activePointIndex === null ? null : coordinates[activePointIndex];

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
    <Card variant="default" className="border border-border bg-card-bg p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-bold text-text-primary">用量趋势</h2>
          <p className="mt-1 text-[13px] text-text-regular">按选定时间范围聚合，悬停或聚焦数据点可查看明细</p>
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
              viewBox="0 0 800 250"
              className="h-64 w-full overflow-visible"
              role="img"
              aria-label={`${tabs.find(tab => tab.key === metric)?.label}趋势折线图`}
            >
              <title>{`${tabs.find(tab => tab.key === metric)?.label}趋势`}</title>
              <desc>{`折线展示各时间桶的${tabs.find(tab => tab.key === metric)?.label}，数值摘要在图表下方。`}</desc>
              <defs>
                <linearGradient id="usage-trend-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
                </linearGradient>
              </defs>
              {[1, 0.75, 0.5, 0.25, 0].map(ratio => {
                const y = plot.bottom - ratio * (plot.bottom - plot.top);
                return (
                  <g key={ratio} aria-hidden="true">
                    <line
                      x1={plot.left}
                      y1={y}
                      x2={plot.right}
                      y2={y}
                      className="stroke-border"
                      strokeDasharray={ratio === 0 ? undefined : "4 6"}
                    />
                    <text x={plot.left - 10} y={y + 4} textAnchor="end" className="fill-text-regular" fontSize="11">
                      {formatMetric(scaleMaxValue * ratio, metric)}
                    </text>
                  </g>
                );
              })}
              <path d={areaPath} fill="url(#usage-trend-area)" aria-hidden="true" />
              <path
                d={path}
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {coordinates.map((coordinate, index) => (
                <circle
                  key={points[index]?.bucket}
                  cx={coordinate.x}
                  cy={coordinate.y}
                  r={activePointIndex === index ? 5 : 3.5}
                  tabIndex={0}
                  className="cursor-pointer fill-card-bg stroke-primary outline-none transition-[r]"
                  strokeWidth={activePointIndex === index ? 4 : 2.5}
                  aria-label={`${formatLocalTime(points[index]?.bucket)}，${formatMetric(values[index] ?? 0, metric)}`}
                  onFocus={() => setActivePointIndex(index)}
                  onBlur={() => setActivePointIndex(null)}
                  onMouseEnter={() => setActivePointIndex(index)}
                  onMouseLeave={() => setActivePointIndex(null)}
                />
              ))}
              {activePoint && activeCoordinate && (
                <g aria-hidden="true" pointerEvents="none">
                  <rect
                    x={Math.min(Math.max(activeCoordinate.x - 72, plot.left), plot.right - 144)}
                    y={Math.max(activeCoordinate.y - 52, 4)}
                    width="144"
                    height="38"
                    rx="8"
                    className="fill-text-primary"
                    opacity="0.94"
                  />
                  <text
                    x={Math.min(Math.max(activeCoordinate.x, plot.left + 72), plot.right - 72)}
                    y={Math.max(activeCoordinate.y - 37, 19)}
                    textAnchor="middle"
                    fill="white"
                    fontSize="11"
                  >
                    {formatLocalTime(activePoint.bucket)}
                  </text>
                  <text
                    x={Math.min(Math.max(activeCoordinate.x, plot.left + 72), plot.right - 72)}
                    y={Math.max(activeCoordinate.y - 22, 34)}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="700"
                  >
                    {formatMetric(metricValue(activePoint, metric), metric)}
                  </text>
                </g>
              )}
              <text x={plot.left} y="238" className="fill-text-regular" fontSize="11">
                {formatLocalTime(points[0]?.bucket)}
              </text>
              <text x={plot.right} y="238" textAnchor="end" className="fill-text-regular" fontSize="11">
                {formatLocalTime(points[points.length - 1]?.bucket)}
              </text>
            </svg>
            <figcaption className="sr-only">
              {`${tabs.find(tab => tab.key === metric)?.label}最大值 ${formatMetric(actualMaxValue, metric)}，累计 ${formatMetric(totalValue, metric)}。`}
            </figcaption>
          </figure>
          <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border pt-3 sm:grid-cols-3">
            {[
              { label: "区间累计", value: formatMetric(totalValue, metric) },
              { label: "时间桶均值", value: formatMetric(averageValue, metric) },
              { label: "区间峰值", value: formatMetric(actualMaxValue, metric) }
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-background px-3 py-2">
                <p className="m-0 text-xs text-text-regular">{item.label}</p>
                <p className="mb-0 mt-1 text-sm font-bold tabular-nums text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
          <table className="sr-only">
            <caption>{`${tabs.find(tab => tab.key === metric)?.label}趋势明细`}</caption>
            <thead>
              <tr>
                <th>时间</th>
                <th>数值</th>
              </tr>
            </thead>
            <tbody>
              {points.map(point => (
                <tr key={point.bucket}>
                  <td>{formatLocalTime(point.bucket)}</td>
                  <td>{formatMetric(metricValue(point, metric), metric)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}
