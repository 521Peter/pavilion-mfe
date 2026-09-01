/* oxlint-disable react/exhaustive-effect-dependencies -- 每个资源使用独立的 retry 触发值，外层 effect 需要主动刷新 */
import { Tabs } from "@heroui/react";
import { BarChart3, ChartNoAxesCombined, ListFilter } from "lucide-react";
import { useEffect, useState } from "react";
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
type UsageTabKey = "trend" | "breakdown" | "runs";

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
  const [activeTab, setActiveTab] = useState<UsageTabKey>("trend");
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
  const [overviewRetryToken, setOverviewRetryToken] = useState(0);
  const [timeseriesRetryToken, setTimeseriesRetryToken] = useState(0);
  const [breakdownRetryToken, setBreakdownRetryToken] = useState(0);
  const [runsRetryToken, setRunsRetryToken] = useState(0);
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
  }, [filters, overviewRetryToken]);

  useEffect(() => {
    if (activeTab !== "trend") return;
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
  }, [activeTab, filters, timeseriesInterval, timeseriesRetryToken]);

  useEffect(() => {
    if (activeTab !== "breakdown") return;
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
  }, [activeTab, filters, breakdownRetryToken]);

  useEffect(() => {
    if (activeTab !== "runs") return;
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
  }, [activeTab, filters, page, runsRetryToken]);

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
    const fromTime = new Date(customFrom).getTime();
    const toTime = new Date(customTo).getTime();
    if (
      !Number.isFinite(fromTime) ||
      !Number.isFinite(toTime) ||
      fromTime >= toTime ||
      toTime - fromTime > 366 * 24 * 60 * 60 * 1000
    ) {
      return;
    }
    setRangeKey("custom");
    setPage(1);
    setFilters(current => ({ ...current, from: customInputToIso(customFrom), to: customInputToIso(customTo) }));
  }

  function resetDimensionFilters() {
    setPage(1);
    setFilters(current => ({ from: current.from, to: current.to }));
  }

  return (
    <main className="h-full overflow-y-auto bg-background">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={key => {
          if (key === "trend" || key === "breakdown" || key === "runs") setActiveTab(key);
        }}
      >
        <Tabs.ListContainer className="mb-5 overflow-x-auto border-b border-border">
          <Tabs.List aria-label="用量统计视图" className="min-w-max bg-transparent p-0">
            <Tabs.Tab id="trend" className="min-h-11 w-auto shrink-0 px-4 font-semibold text-text-regular">
              <ChartNoAxesCombined aria-hidden="true" className="size-4" />
              趋势分析
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="breakdown" className="min-h-11 w-auto shrink-0 px-4 font-semibold text-text-regular">
              <BarChart3 aria-hidden="true" className="size-4" />
              维度排行
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="runs" className="min-h-11 w-auto shrink-0 px-4 font-semibold text-text-regular">
              <ListFilter aria-hidden="true" className="size-4" />
              调用明细
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {optionsError && (
          <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
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
          onResetFilters={resetDimensionFilters}
        />

        <UsageMetrics state={overview} onRetry={() => setOverviewRetryToken(token => token + 1)} />

        <Tabs.Panel id="trend" className="pb-5 pt-0">
          <UsageTrendChart state={timeseries} onRetry={() => setTimeseriesRetryToken(token => token + 1)} />
        </Tabs.Panel>
        <Tabs.Panel id="breakdown" className="pt-0">
          <UsageBreakdowns state={breakdown} onRetry={() => setBreakdownRetryToken(token => token + 1)} />
        </Tabs.Panel>
        <Tabs.Panel id="runs" className="pb-5 pt-0">
          <UsageRunsTable state={runs} onPageChange={setPage} onRetry={() => setRunsRetryToken(token => token + 1)} />
        </Tabs.Panel>
      </Tabs>
    </main>
  );
}
