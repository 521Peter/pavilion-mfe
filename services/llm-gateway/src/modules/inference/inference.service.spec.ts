/* oxlint-disable typescript/no-unsafe-type-assertion -- unit tests provide focused service boundary doubles. */
import type { PrismaService } from "@/database/prisma.service";
import type { LlmProviderService } from "@/modules/llm/services/llm-provider.service";
import type { ModelRoutingService } from "@/modules/model-routing/model-routing.service";
import type { UsageService } from "@/modules/usage/usage.service";
import { InferenceHooksService } from "./inference-hooks.service";
import { InferenceService } from "./inference.service";
import type { NormalizedLlmRequest } from "./inference.types";
import type { RunService } from "./run.service";

const request: NormalizedLlmRequest = {
  requestId: "request-1",
  model: "model-alias",
  messages: [{ role: "user", content: "hello" }],
  principal: { authenticationType: "application", applicationId: "application-1" }
};

function createService() {
  const prisma = {
    $transaction: jest.fn().mockResolvedValue([{ id: "attempt-1" }, { id: "step-1" }]),
    providerAttempt: { create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) },
    runStep: { create: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}) }
  };
  const providers = { getDeploymentModel: jest.fn() };
  const routing = {
    resolve: jest.fn().mockResolvedValue({
      virtualModel: { id: "virtual-model-1" },
      targets: [
        {
          deploymentId: "deployment-1",
          deployment: { inputPricePerM: "2", outputPricePerM: "3" }
        }
      ],
      policy: { maxRetries: 0, requestTimeout: 60_000, circuitFailures: 3, circuitCooldown: 30_000 }
    }),
    recordSuccess: jest.fn(),
    recordFailure: jest.fn()
  };
  const usage = { record: jest.fn() };
  const hooks = {
    onRequest: jest.fn(),
    beforeAttempt: jest.fn(),
    afterAttempt: jest.fn(),
    onResponse: jest.fn(),
    onError: jest.fn(),
    onStreamChunk: jest.fn()
  };
  const runs = {
    create: jest.fn().mockResolvedValue({ run: { id: "run-1" }, controller: new AbortController() }),
    finish: jest.fn().mockResolvedValue(undefined),
    fail: jest.fn().mockResolvedValue(undefined)
  };
  const service = new InferenceService(
    prisma as unknown as PrismaService,
    providers as unknown as LlmProviderService,
    routing as unknown as ModelRoutingService,
    usage as unknown as UsageService,
    hooks as unknown as InferenceHooksService,
    runs as unknown as RunService
  );
  return { service, providers, usage, runs };
}

describe("InferenceService", () => {
  it("用量写入失败时仍完成 Run 并返回非流式成功结果", async () => {
    const { service, usage, runs } = createService();
    usage.record.mockRejectedValue(new Error("usage unavailable"));

    await expect(
      service.execute(request, async () => ({
        content: "ok",
        usage: { inputTokens: 3, outputTokens: 5, cachedTokens: 0, reasoningTokens: 0 }
      }))
    ).resolves.toMatchObject({ content: "ok" });

    expect(runs.finish).toHaveBeenCalledWith(
      "run-1",
      expect.anything(),
      expect.objectContaining({ runId: "run-1", deploymentId: "deployment-1", occurredAt: expect.any(String) })
    );
  });

  it("用量写入失败时仍发送流式 done 事件", async () => {
    const { service, providers, usage, runs } = createService();
    usage.record.mockRejectedValue(new Error("usage unavailable"));
    providers.getDeploymentModel.mockResolvedValue({
      stream: async function* () {
        yield { content: "ok", usage_metadata: { input_tokens: 3, output_tokens: 5 } };
      }
    });

    const events = [];
    for await (const event of service.stream(request)) events.push(event);

    expect(events).toEqual([
      { type: "start", id: "run-1", requestId: "request-1", model: "model-alias" },
      { type: "delta", delta: "ok" },
      {
        type: "done",
        usage: { inputTokens: 3, outputTokens: 5, cachedTokens: 0, reasoningTokens: 0 },
        deploymentId: "deployment-1"
      }
    ]);
    expect(runs.finish).toHaveBeenCalledWith(
      "run-1",
      expect.anything(),
      expect.objectContaining({ runId: "run-1", deploymentId: "deployment-1", occurredAt: expect.any(String) })
    );
  });
});
