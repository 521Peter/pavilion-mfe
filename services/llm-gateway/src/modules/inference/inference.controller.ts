import { Body, Controller, Get, HttpCode, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import { ModelRoutingService } from "@/modules/model-routing/model-routing.service";
import { ChatCompletionsDto, ResponsesDto } from "./dto/inference.dto";
import { DataPlaneAuthGuard, type DataPlaneRequest } from "./data-plane-auth.guard";
import { InferenceRateLimitGuard } from "./inference-rate-limit.guard";
import { InferenceService } from "./inference.service";
import { RunService } from "./run.service";
import type { NormalizedLlmRequest, NormalizedMessage } from "./inference.types";

function requestId(request: DataPlaneRequest): string {
  const incoming = request.headers["x-request-id"];
  return typeof incoming === "string" && incoming.length <= 128 ? incoming : randomUUID();
}

function normalized(
  request: DataPlaneRequest,
  model: string,
  messages: NormalizedMessage[],
  temperature?: number,
  maxTokens?: number,
  signal?: AbortSignal
): NormalizedLlmRequest {
  return {
    requestId: requestId(request),
    model,
    messages,
    temperature,
    maxTokens,
    principal: request.principal,
    signal
  };
}

@UseGuards(DataPlaneAuthGuard, InferenceRateLimitGuard)
@Controller("v1")
export class InferenceController {
  constructor(
    private readonly inference: InferenceService,
    private readonly routing: ModelRoutingService,
    private readonly runs: RunService
  ) {}

  @Get("models")
  async models(@Req() request: DataPlaneRequest) {
    const models = await this.routing.listVirtualModels();
    const allowed = request.principal.allowedModels;
    return {
      object: "list",
      data: models
        .filter(model => !allowed?.length || allowed.includes(model.name))
        .map(model => ({
          id: model.name,
          object: "model",
          created: Math.floor(model.createdAt.getTime() / 1000),
          owned_by: "pavilion"
        }))
    };
  }

  @Post("chat/completions")
  @HttpCode(200)
  async chat(
    @Req() request: DataPlaneRequest,
    @Body() dto: ChatCompletionsDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const abort = new AbortController();
    request.once("aborted", () => abort.abort());
    const input = normalized(request, dto.model, dto.messages, dto.temperature, dto.max_tokens, abort.signal);
    if (dto.stream) {
      response.status(200);
      response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.flushHeaders();
      response.once("close", () => abort.abort());
      try {
        for await (const event of this.inference.stream(input)) {
          if (event.type === "start") {
            response.write(
              `data: ${JSON.stringify({ id: event.id, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: dto.model, choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }] })}\n\n`
            );
          } else if (event.type === "delta") {
            response.write(
              `data: ${JSON.stringify({ object: "chat.completion.chunk", model: dto.model, choices: [{ index: 0, delta: { content: event.delta }, finish_reason: null }] })}\n\n`
            );
          } else {
            response.write(
              `data: ${JSON.stringify({ object: "chat.completion.chunk", model: dto.model, choices: [{ index: 0, delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: event.usage.inputTokens, completion_tokens: event.usage.outputTokens, total_tokens: event.usage.inputTokens + event.usage.outputTokens } })}\n\n`
            );
          }
        }
        response.write("data: [DONE]\n\n");
      } catch (error) {
        if (!response.writableEnded)
          response.write(
            `data: ${JSON.stringify({ error: { message: error instanceof Error ? error.message : String(error), type: "gateway_error" } })}\n\n`
          );
      } finally {
        response.end();
      }
      return;
    }
    const result = await this.inference.execute(input);
    response.setHeader("x-request-id", result.requestId);
    return {
      id: result.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: result.model,
      choices: [{ index: 0, message: { role: "assistant", content: result.content }, finish_reason: "stop" }],
      usage: {
        prompt_tokens: result.usage.inputTokens,
        completion_tokens: result.usage.outputTokens,
        total_tokens: result.usage.inputTokens + result.usage.outputTokens
      }
    };
  }

  @Post("responses")
  @HttpCode(200)
  async responses(
    @Req() request: DataPlaneRequest,
    @Body() dto: ResponsesDto,
    @Res({ passthrough: true }) response: Response
  ) {
    const messages: NormalizedMessage[] =
      typeof dto.input === "string" ? [{ role: "user", content: dto.input }] : dto.input;
    if (dto.instructions) messages.unshift({ role: "system", content: dto.instructions });
    const abort = new AbortController();
    request.once("aborted", () => abort.abort());
    const input = normalized(request, dto.model, messages, dto.temperature, dto.max_output_tokens, abort.signal);
    if (dto.stream) {
      response.status(200);
      response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      response.flushHeaders();
      response.once("close", () => abort.abort());
      let responseId = "";
      try {
        for await (const event of this.inference.stream(input)) {
          if (event.type === "start") {
            responseId = event.id;
            response.write(
              `event: response.created\ndata: ${JSON.stringify({ type: "response.created", response: { id: event.id, object: "response", status: "in_progress", model: dto.model } })}\n\n`
            );
          } else if (event.type === "delta") {
            response.write(
              `event: response.output_text.delta\ndata: ${JSON.stringify({ type: "response.output_text.delta", response_id: responseId, delta: event.delta })}\n\n`
            );
          } else {
            response.write(
              `event: response.completed\ndata: ${JSON.stringify({ type: "response.completed", response: { id: responseId, status: "completed", model: dto.model, usage: { input_tokens: event.usage.inputTokens, output_tokens: event.usage.outputTokens, total_tokens: event.usage.inputTokens + event.usage.outputTokens } } })}\n\n`
            );
          }
        }
      } catch (error) {
        if (!response.writableEnded)
          response.write(
            `event: error\ndata: ${JSON.stringify({ type: "error", error: { message: error instanceof Error ? error.message : String(error) } })}\n\n`
          );
      } finally {
        response.end();
      }
      return;
    }
    const result = await this.inference.execute(input);
    return {
      id: result.id,
      object: "response",
      created_at: Math.floor(Date.now() / 1000),
      status: "completed",
      model: result.model,
      output: [
        {
          id: `msg_${result.id}`,
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: result.content, annotations: [] }]
        }
      ],
      output_text: result.content,
      usage: {
        input_tokens: result.usage.inputTokens,
        output_tokens: result.usage.outputTokens,
        total_tokens: result.usage.inputTokens + result.usage.outputTokens
      }
    };
  }

  @Get("runs/:id")
  getRun(@Req() request: DataPlaneRequest, @Param("id") id: string) {
    return this.runs.get(id, request.principal);
  }

  @Post("runs/:id/cancel")
  @HttpCode(200)
  async cancelRun(@Req() request: DataPlaneRequest, @Param("id") id: string) {
    await this.runs.cancel(id, request.principal);
    return { id, status: "cancelled" };
  }
}
