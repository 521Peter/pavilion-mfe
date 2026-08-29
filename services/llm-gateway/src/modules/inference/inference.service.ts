import { BadGatewayException, Injectable, Logger, RequestTimeoutException } from "@nestjs/common";
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { PrismaService } from "@/database/prisma.service";
import { LlmProviderService } from "@/modules/llm/services/llm-provider.service";
import { ModelRoutingService } from "@/modules/model-routing/model-routing.service";
import { UsageService } from "@/modules/usage/usage.service";
import type { UsageSnapshot } from "@/modules/usage/usage.types";
import { InferenceHooksService } from "./inference-hooks.service";
import { RunService } from "./run.service";
import { toPrismaJson } from "@/database/prisma-json";
import type { InferenceResult, InferenceStreamEvent, NormalizedLlmRequest, TokenUsage } from "./inference.types";

const EMPTY_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0, cachedTokens: 0, reasoningTokens: 0 };

function messages(input: NormalizedLlmRequest): BaseMessage[] {
  return input.messages.map(message => {
    if (message.role === "system") return new SystemMessage(message.content);
    if (message.role === "assistant") return new AIMessage(message.content);
    return new HumanMessage(message.content);
  });
}

function text(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map(block =>
      typeof block === "string"
        ? block
        : block && typeof block === "object" && "text" in block
          ? String(block.text)
          : ""
    )
    .join("");
}

function usageOf(message: unknown): TokenUsage {
  const value = typeof message === "object" && message !== null ? Object.fromEntries(Object.entries(message)) : {};
  const usageMetadata = jsonRecord(value.usage_metadata);
  const responseMetadata = jsonRecord(value.response_metadata);
  const usage = Object.keys(usageMetadata).length > 0 ? usageMetadata : jsonRecord(responseMetadata.tokenUsage);
  const inputDetails = jsonRecord(usage.input_token_details);
  const outputDetails = jsonRecord(usage.output_token_details);
  return {
    inputTokens: firstNumber(usage.input_tokens, usage.promptTokens),
    outputTokens: firstNumber(usage.output_tokens, usage.completionTokens),
    cachedTokens: firstNumber(inputDetails.cache_read),
    reasoningTokens: firstNumber(outputDetails.reasoning)
  };
}

function jsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value));
}

function firstNumber(...values: unknown[]): number {
  return values.find((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? 0;
}

function mergeUsage(current: TokenUsage, next: TokenUsage): TokenUsage {
  return {
    inputTokens: Math.max(current.inputTokens, next.inputTokens),
    outputTokens: Math.max(current.outputTokens, next.outputTokens),
    cachedTokens: Math.max(current.cachedTokens, next.cachedTokens),
    reasoningTokens: Math.max(current.reasoningTokens, next.reasoningTokens)
  };
}

function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = "status" in error ? error.status : undefined;
  const statusCode = "statusCode" in error ? error.statusCode : undefined;
  return typeof status === "number" ? status : typeof statusCode === "number" ? statusCode : undefined;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return false;
  const status = statusOf(error);
  return status === undefined || status === 408 || status === 409 || status === 429 || status >= 500;
}

@Injectable()
export class InferenceService {
  private readonly logger = new Logger(InferenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: LlmProviderService,
    private readonly routing: ModelRoutingService,
    private readonly usage: UsageService,
    private readonly hooks: InferenceHooksService,
    private readonly runs: RunService
  ) {}

  async execute(
    request: NormalizedLlmRequest,
    executor?: (model: BaseChatModel, signal: AbortSignal) => Promise<{ content: string; usage?: TokenUsage }>
  ): Promise<InferenceResult> {
    this.hooks.onRequest(request.requestId);
    const resolved = await this.routing.resolve(request.model, request.principal.allowedModels);
    const { run, controller } = await this.runs.create(request, resolved.virtualModel.id);
    const started = Date.now();
    let ordinal = 0;
    let lastError: unknown;
    try {
      for (const target of resolved.targets) {
        for (let retry = 0; retry <= resolved.policy.maxRetries; retry += 1) {
          ordinal += 1;
          this.hooks.beforeAttempt(request.requestId, target.deploymentId, ordinal);
          const [attempt, step] = await this.prisma.$transaction([
            this.prisma.providerAttempt.create({
              data: {
                requestId: request.requestId,
                runId: run.id,
                deploymentId: target.deploymentId,
                attempt: ordinal,
                status: "running"
              }
            }),
            this.prisma.runStep.create({
              data: {
                runId: run.id,
                sequence: ordinal,
                type: "model_call",
                status: "running",
                input: { deploymentId: target.deploymentId }
              }
            })
          ]);
          const attemptStarted = Date.now();
          try {
            const model = await this.providers.getDeploymentModel(target.deploymentId);
            const signal = AbortSignal.any([
              controller.signal,
              ...(request.signal ? [request.signal] : []),
              AbortSignal.timeout(resolved.policy.requestTimeout)
            ]);
            const modelOptions = { signal, temperature: request.temperature, maxTokens: request.maxTokens };
            const executed = executor
              ? await executor(model, signal)
              : await model
                  .invoke(messages(request), modelOptions)
                  .then(response => ({ content: text(response.content), usage: usageOf(response) }));
            const content = executed.content;
            const tokenUsage = executed.usage ?? { ...EMPTY_USAGE };
            await this.completeAttempt(attempt.id, "success", Date.now() - attemptStarted, tokenUsage);
            await this.prisma.runStep.update({
              where: { id: step.id },
              data: { status: "completed", output: { content }, completedAt: new Date() }
            });
            this.routing.recordSuccess(target.deploymentId);
            const snapshot: UsageSnapshot = {
              occurredAt: new Date(started).toISOString(),
              requestId: request.requestId,
              runId: run.id,
              userId: request.principal.userId,
              applicationId: request.principal.applicationId,
              virtualModelId: resolved.virtualModel.id,
              deploymentId: target.deploymentId,
              ...tokenUsage,
              inputPricePerM: Number(target.deployment.inputPricePerM),
              outputPricePerM: Number(target.deployment.outputPricePerM),
              latencyMs: Date.now() - started,
              fallbackCount: Math.max(0, ordinal - 1)
            };
            const result = {
              id: run.id,
              requestId: request.requestId,
              model: request.model,
              content,
              usage: tokenUsage,
              deploymentId: target.deploymentId
            };
            await this.runs.finish(run.id, toPrismaJson(result), snapshot);
            await this.recordUsage(snapshot);
            this.hooks.afterAttempt(request.requestId, target.deploymentId, "success");
            this.hooks.onResponse(request.requestId);
            return result;
          } catch (error) {
            lastError = error;
            const retryable = isRetryable(error);
            await this.completeAttempt(attempt.id, "failed", Date.now() - attemptStarted, EMPTY_USAGE, error);
            await this.prisma.runStep.update({
              where: { id: step.id },
              data: {
                status: "failed",
                error: { message: error instanceof Error ? error.message : String(error) },
                completedAt: new Date()
              }
            });
            this.hooks.afterAttempt(request.requestId, target.deploymentId, "failed");
            if (retryable)
              this.routing.recordFailure(
                target.deploymentId,
                resolved.policy.circuitFailures,
                resolved.policy.circuitCooldown
              );
            if (!retryable) throw error;
          }
        }
      }
      throw lastError ?? new BadGatewayException("所有 Provider Deployment 均不可用");
    } catch (error) {
      const cancelled = controller.signal.aborted || request.signal?.aborted === true;
      await this.runs.fail(run.id, error, cancelled);
      this.hooks.onError(request.requestId, error);
      if (error instanceof DOMException && error.name === "TimeoutError")
        throw new RequestTimeoutException("模型请求超时");
      throw error;
    }
  }

  async *stream(request: NormalizedLlmRequest): AsyncGenerator<InferenceStreamEvent> {
    this.hooks.onRequest(request.requestId);
    const resolved = await this.routing.resolve(request.model, request.principal.allowedModels);
    const { run, controller } = await this.runs.create(request, resolved.virtualModel.id);
    yield { type: "start", id: run.id, requestId: request.requestId, model: request.model };
    const started = Date.now();
    let ordinal = 0;
    let lastError: unknown;
    try {
      for (const target of resolved.targets) {
        for (let retry = 0; retry <= resolved.policy.maxRetries; retry += 1) {
          ordinal += 1;
          const [attempt, step] = await this.prisma.$transaction([
            this.prisma.providerAttempt.create({
              data: {
                requestId: request.requestId,
                runId: run.id,
                deploymentId: target.deploymentId,
                attempt: ordinal,
                status: "running"
              }
            }),
            this.prisma.runStep.create({
              data: {
                runId: run.id,
                sequence: ordinal,
                type: "model_call",
                status: "running",
                input: { deploymentId: target.deploymentId }
              }
            })
          ]);
          const attemptStarted = Date.now();
          let emitted = false;
          let ttftMs: number | undefined;
          let tokenUsage = { ...EMPTY_USAGE };
          let output = "";
          try {
            this.hooks.beforeAttempt(request.requestId, target.deploymentId, ordinal);
            const model = await this.providers.getDeploymentModel(target.deploymentId);
            const signal = AbortSignal.any([
              controller.signal,
              ...(request.signal ? [request.signal] : []),
              AbortSignal.timeout(resolved.policy.requestTimeout)
            ]);
            const modelOptions = { signal, temperature: request.temperature, maxTokens: request.maxTokens };
            const modelStream = await model.stream(messages(request), modelOptions);
            for await (const chunk of modelStream) {
              tokenUsage = mergeUsage(tokenUsage, usageOf(chunk));
              const delta = text(chunk.content);
              if (!delta) continue;
              ttftMs ??= Date.now() - attemptStarted;
              emitted = true;
              output += delta;
              this.hooks.onStreamChunk(request.requestId, delta);
              yield { type: "delta", delta };
            }
            await this.completeAttempt(
              attempt.id,
              "success",
              Date.now() - attemptStarted,
              tokenUsage,
              undefined,
              ttftMs
            );
            await this.prisma.runStep.update({
              where: { id: step.id },
              data: { status: "completed", output: { content: output }, completedAt: new Date() }
            });
            this.routing.recordSuccess(target.deploymentId);
            const snapshot: UsageSnapshot = {
              occurredAt: new Date(started).toISOString(),
              requestId: request.requestId,
              runId: run.id,
              userId: request.principal.userId,
              applicationId: request.principal.applicationId,
              virtualModelId: resolved.virtualModel.id,
              deploymentId: target.deploymentId,
              ...tokenUsage,
              inputPricePerM: Number(target.deployment.inputPricePerM),
              outputPricePerM: Number(target.deployment.outputPricePerM),
              latencyMs: Date.now() - started,
              fallbackCount: Math.max(0, ordinal - 1)
            };
            await this.runs.finish(run.id, { content: output }, snapshot);
            await this.recordUsage(snapshot);
            this.hooks.afterAttempt(request.requestId, target.deploymentId, "success");
            this.hooks.onResponse(request.requestId);
            yield { type: "done", usage: tokenUsage, deploymentId: target.deploymentId };
            return;
          } catch (error) {
            lastError = error;
            await this.completeAttempt(attempt.id, "failed", Date.now() - attemptStarted, tokenUsage, error, ttftMs);
            await this.prisma.runStep.update({
              where: { id: step.id },
              data: {
                status: "failed",
                error: { message: error instanceof Error ? error.message : String(error) },
                completedAt: new Date()
              }
            });
            this.hooks.afterAttempt(request.requestId, target.deploymentId, "failed");
            if (emitted || !isRetryable(error)) throw error;
            this.routing.recordFailure(
              target.deploymentId,
              resolved.policy.circuitFailures,
              resolved.policy.circuitCooldown
            );
          }
        }
      }
      throw lastError ?? new BadGatewayException("所有 Provider Deployment 均不可用");
    } catch (error) {
      await this.runs.fail(run.id, error, controller.signal.aborted || request.signal?.aborted === true);
      this.hooks.onError(request.requestId, error);
      throw error;
    }
  }

  private completeAttempt(
    id: string,
    status: string,
    latencyMs: number,
    usage: TokenUsage,
    error?: unknown,
    ttftMs?: number
  ) {
    return this.prisma.providerAttempt.update({
      where: { id },
      data: {
        status,
        latencyMs,
        ttftMs,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        statusCode: statusOf(error),
        errorType: error instanceof Error ? error.name : undefined
      }
    });
  }

  private async recordUsage(snapshot: UsageSnapshot): Promise<void> {
    try {
      await this.usage.record(snapshot);
    } catch (error) {
      this.logger.error({
        event: "usage.record.deferred",
        requestId: snapshot.requestId,
        runId: snapshot.runId,
        errorType: error instanceof Error ? error.name : "UnknownError"
      });
    }
  }
}
