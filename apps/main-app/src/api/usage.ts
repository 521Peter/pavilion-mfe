import { http } from "./http";

export type UsageFilters = {
  from: string;
  to: string;
  applicationId?: string;
  virtualModelId?: string;
  providerId?: string;
  status?: "completed" | "failed" | "cancelled";
};

export type UsageRunsQuery = UsageFilters & {
  page: number;
  pageSize: number;
  requestId?: string;
};

export interface UsageOverview {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  successRate: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  estimatedCost: string;
  averageLatencyMs: number;
  fallbackCount: number;
}

export interface UsageTimeseriesPoint {
  bucket: string;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  estimatedCost: string;
}

export interface UsageDimensionBreakdownItem {
  id: string;
  name: string;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: string;
}

export interface UsageProviderBreakdownItem extends UsageDimensionBreakdownItem {
  type: string;
}

export interface UsageBreakdown {
  applications: UsageDimensionBreakdownItem[];
  virtualModels: UsageDimensionBreakdownItem[];
  providers: UsageProviderBreakdownItem[];
}

export interface UsageRunRecord {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  estimatedCost: string;
  latencyMs: number | null;
  fallbackCount: number;
  deployment: {
    id: string;
    name: string;
    upstreamModel: string;
    provider: { id: string; name: string; type: string };
  } | null;
}

export interface UsageRunItem {
  id: string;
  requestId: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  user: { id: string; username: string; nickname: string | null } | null;
  application: { id: string; code: string; name: string } | null;
  virtualModel: { id: string; name: string; displayName: string | null } | null;
  usageRecords: UsageRunRecord[];
  attempts: Array<{ status: string; errorType: string | null }>;
}

export interface UsageRunPage {
  items: UsageRunItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UsageOption {
  id: string;
  label: string;
}

export interface UsageProviderOption extends UsageOption {
  type: string;
}

export interface UsageOptions {
  applications: UsageOption[];
  virtualModels: UsageOption[];
  providers: UsageProviderOption[];
}

type ApplicationApiResponse = { id: string; code: string; name: string };
type VirtualModelApiResponse = { id: string; name: string; displayName: string | null };
type DeploymentApiResponse = {
  provider: { id: string; name: string; type: string };
};

function query(filters: object): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

async function loadUsageOptions(signal?: AbortSignal): Promise<UsageOptions> {
  const [applications, virtualModels, deployments] = await Promise.all([
    http<ApplicationApiResponse[]>("/applications", { signal }),
    http<VirtualModelApiResponse[]>("/llm/virtual-models", { signal }),
    http<DeploymentApiResponse[]>("/llm/deployments", { signal })
  ]);
  const providers = Array.from(new Map(deployments.map(item => [item.provider.id, item.provider])).values());

  return {
    applications: applications.map(item => ({ id: item.id, label: item.name || item.code })),
    virtualModels: virtualModels.map(item => ({ id: item.id, label: item.displayName || item.name })),
    providers: providers.map(item => ({ id: item.id, label: item.name, type: item.type }))
  };
}

export const usageApi = {
  overview: (filters: UsageFilters, signal?: AbortSignal) =>
    http<UsageOverview>(`/usage/overview?${query(filters)}`, { signal }),
  timeseries: (filters: UsageFilters, interval: "hour" | "day" | undefined, signal?: AbortSignal) =>
    http<UsageTimeseriesPoint[]>(`/usage/timeseries?${query({ ...filters, interval })}`, { signal }),
  breakdown: (filters: UsageFilters, signal?: AbortSignal) =>
    http<UsageBreakdown>(`/usage/breakdown?${query(filters)}`, { signal }),
  runs: (filters: UsageRunsQuery, signal?: AbortSignal) =>
    http<UsageRunPage>(`/usage/runs?${query(filters)}`, { signal }),
  options: (signal?: AbortSignal) => loadUsageOptions(signal)
};
