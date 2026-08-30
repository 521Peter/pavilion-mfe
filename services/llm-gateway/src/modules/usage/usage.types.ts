export interface UsageSnapshot {
  occurredAt: string;
  requestId: string;
  runId: string;
  userId?: string;
  applicationId: string;
  virtualModelId: string;
  deploymentId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  reasoningTokens: number;
  inputPricePerM: number;
  outputPricePerM: number;
  latencyMs: number;
  fallbackCount: number;
}

export type UsageStatus = "completed" | "failed" | "cancelled";

/** estimatedCost 始终以十进制字符串输出，避免 JSON number 丢失 Decimal 精度。 */
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

export interface UsageFailureBreakdownItem {
  errorType: string;
  providerId: string;
  providerName: string;
  providerType: string;
  count: number;
}

export interface UsageFallbackBreakdownItem {
  deploymentId: string;
  deploymentName: string;
  upstreamModel: string;
  providerId: string;
  providerName: string;
  providerType: string;
  runs: number;
  fallbackCount: number;
}

export interface UsageBreakdown {
  applications: UsageDimensionBreakdownItem[];
  virtualModels: UsageDimensionBreakdownItem[];
  providers: UsageProviderBreakdownItem[];
  failures: UsageFailureBreakdownItem[];
  fallbacks: UsageFallbackBreakdownItem[];
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
