// oxlint-disable react/exhaustive-effect-dependencies -- 每个资源使用独立的 retry 触发值，外层 effect 需要主动刷新
import { useEffect, useMemo, useState } from "react";
import {
  usageApi,
  type UsageBreakdown,
  type UsageFilters,
  type UsageOptions,
  type UsageOverview,
  type UsageRunPage,
  type UsageTimeseriesPoint
} from "../api/usage";
import UsageBreakdowns from "./usage/UsageBreakdowns";
import UsageFiltersPanel, { type UsageRangeKey } from "./usage/UsageFilters";
import UsageMetrics, { type ResourceState } from "./usage/UsageMetrics";
import UsageRunsTable from "./usage/UsageRunsTable";
import UsageTrendChart from "./usage/UsageTrendChart";

const emptyOptions: UsageOptions = { applications: [], virtualModels: [], providers: [] };

function isoTime(date: Date): string {
  return date.toISOString();
}

function rangeFilters(range: Exclude<UsageRangeKey, "custom">): UsageFilters {
  const to = new Date();
  const from = new Date(to);
  if (range === "24h") from.setHours(from.getHours() - 24);
  if (range === "7d") from.setDate(from.getDate() - 7);
  if (range === "30d") from.setDate(from.getDate() - 30);
  return { from: isoTime(from), to: isoTime(to) };
}

function customInputToIso(value: string): string {
  return new Date(value).toISOString();
}

function initialError<T>(): ResourceState<T> {
  return { status: "loading" };
}

function loadError(error: unknown): ResourceState<never> {
  return { status: "error", message: error instanceof Error ? error.message : "加载失败" };
}

export default function Usage() {
  const [rangeKey, setRangeKey] = useState<UsageRangeKey>("7d");
  const [filters, setFilters] = useState<UsageFilters>(() => rangeFilters("7d"));
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [options, setOptions] = useState<UsageOptions>(emptyOptions);
  const [optionsError, setOptionsError] = useState("");
  const [overview, setOverview] = useState<ResourceState<UsageOverview>>(initialError);
  const [timeseries, setTimeseries] = useState<ResourceState<UsageTimeseriesPoint[]>>(initialError);
  const [breakdown, setBreakdown] = useState<ResourceState<UsageBreakdown>>(initialError);
  const [runs, setRuns] = useState<ResourceState<UsageRunPage>>(initialError);
  const [page, setPage] = useState(1);
  const [retryToken, setRetryToken] = useState(0);
  const timeseriesInterval = rangeKey === "24h" ? "hour" : "day";

  useEffect(() => {
    const controller = new AbortController();
    usageApi
      .options(controller.signal)
      .then(data => setOptions(data))
      .catch(error => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOptionsError(error instanceof Error ? error.message : "筛选选项加载失败");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      setOverview({ status: "loading" });
      try {
        const data = await usageApi.overview(filters, controller.signal);
        setOverview({ status: "success", data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOverview(loadError(error));
      }
    }

    void loadOverview();
    return () => controller.abort();
  }, [filters, retryToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTimeseries() {
      setTimeseries({ status: "loading" });
      try {
        const data = await usageApi.timeseries(filters, timeseriesInterval, controller.signal);
        setTimeseries({ status: "success", data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setTimeseries(loadError(error));
      }
    }

    void loadTimeseries();
    return () => controller.abort();
  }, [filters, timeseriesInterval, retryToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBreakdown() {
      setBreakdown({ status: "loading" });
      try {
        const data = await usageApi.breakdown(filters, controller.signal);
        setBreakdown({ status: "success", data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setBreakdown(loadError(error));
      }
    }

    void loadBreakdown();
    return () => controller.abort();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- retryToken is an explicit refresh trigger
  }, [filters, retryToken]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRuns() {
      setRuns({ status: "loading" });
      try {
        const data = await usageApi.runs({ ...filters, page, pageSize: 20 }, controller.signal);
        setRuns({ status: "success", data });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setRuns(loadError(error));
      }
    }

    void loadRuns();
    return () => controller.abort();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- retryToken is an explicit refresh trigger
  }, [filters, page, retryToken]);

  const trendPoints = useMemo(() => (timeseries.status === "success" ? timeseries.data : []), [timeseries]);

  function changeRange(range: Exclude<UsageRangeKey, "custom">) {
    setRangeKey(range);
    setPage(1);
    setFilters(rangeFilters(range));
  }

  function changeFilter(field: "applicationId" | "virtualModelId" | "providerId" | "status", value: string) {
    setPage(1);
    setFilters(current => {
      const next = { ...current };
      if (!value) {
        if (field === "status") delete next.status;
        else delete next[field];
      } else if (field === "status") {
        if (value === "completed" || value === "failed" || value === "cancelled") next.status = value;
      } else {
        next[field] = value;
      }
      return next;
    });
  }

  function applyCustomRange() {
    if (!customFrom || !customTo || customFrom > customTo) return;
    setRangeKey("custom");
    setPage(1);
    setFilters(current => ({ ...current, from: customInputToIso(customFrom), to: customInputToIso(customTo) }));
  }

  return (
    <main className="h-full overflow-y-auto p-5 lg:p-6">
      <div className="mb-5">
        <h1 className="m-0 text-xl font-bold text-text-primary">用量统计</h1>
        <p className="mt-1 text-[13px] text-text-muted">查看统一模型入口的调用、Token、费用与失败情况</p>
      </div>

      {optionsError && (
        <p role="alert" className="mb-4 rounded border border-border bg-card-bg p-3 text-[13px] text-danger">
          {optionsError}
        </p>
      )}

      <UsageFiltersPanel
        rangeKey={rangeKey}
        customFrom={customFrom}
        customTo={customTo}
        options={options}
        applicationId={filters.applicationId}
        virtualModelId={filters.virtualModelId}
        providerId={filters.providerId}
        status={filters.status}
        onRangeChange={changeRange}
        onCustomChange={(field, value) => (field === "from" ? setCustomFrom(value) : setCustomTo(value))}
        onApplyCustom={applyCustomRange}
        onFilterChange={changeFilter}
      />

      <UsageMetrics state={overview} onRetry={() => setRetryToken(token => token + 1)} />
      <div className="mb-5">
        <UsageTrendChart points={trendPoints} />
      </div>
      <UsageBreakdowns state={breakdown} onRetry={() => setRetryToken(token => token + 1)} />
      <UsageRunsTable state={runs} onPageChange={setPage} onRetry={() => setRetryToken(token => token + 1)} />
    </main>
  );
}
