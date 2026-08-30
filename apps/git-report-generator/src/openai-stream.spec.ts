/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";
import { parseChatCompletionEvent, readOpenAiStream } from "./openai-stream.ts";

void test("accepts OpenAI chat completion stream frames", () => {
  assert.deepEqual(parseChatCompletionEvent('{"choices":[{"delta":{"content":"report"}}]}'), {
    type: "delta",
    delta: "report"
  });
  assert.deepEqual(parseChatCompletionEvent("[DONE]"), { type: "done" });
  assert.deepEqual(parseChatCompletionEvent('{"error":{"message":"failed"}}'), { type: "error", message: "failed" });
});

void test("rejects malformed and unsupported SSE payloads", () => {
  assert.throws(() => parseChatCompletionEvent("{"), /AI 报告流返回了无效事件/);
  assert.throws(() => parseChatCompletionEvent('{"object":"chat.completion.chunk"}'), /AI 报告流返回了无效事件/);
  assert.throws(() => parseChatCompletionEvent('{"error":{"message":42}}'), /AI 报告流返回了无效事件/);
});

void test("reads frames split across SSE chunks", async () => {
  const encoder = new TextEncoder();
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"report"}}]}\n'));
        controller.enqueue(encoder.encode("\ndata: [DONE]\n\n"));
        controller.close();
      }
    })
  );
  const abortController = new AbortController();
  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, [{ type: "delta", delta: "report" }, { type: "done" }]);
});

void test("ignores valid role-only and finish-only OpenAI frames", async () => {
  const response = new Response(
    'data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{"content":"report"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n'
  );
  const abortController = new AbortController();
  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, [{ type: "delta", delta: "report" }]);
});

void test("rejects empty data frames", async () => {
  const response = new Response("data:\n\n");
  const abortController = new AbortController();

  await assert.rejects(async () => {
    const events = [];
    for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);
  }, /AI 报告流返回了无效事件/);
});

void test("ignores comments and keepalive frames without data", async () => {
  const response = new Response(": keepalive\n\nevent: ping\nid: heartbeat\n\n");
  const abortController = new AbortController();
  const events = [];

  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, []);
});

void test("cancels the reader when the request is already aborted", async () => {
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      cancel() {
        cancelled = true;
      }
    })
  );
  const abortController = new AbortController();
  abortController.abort();

  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, []);
  assert.equal(cancelled, true);
});
