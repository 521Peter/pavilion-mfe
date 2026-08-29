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
