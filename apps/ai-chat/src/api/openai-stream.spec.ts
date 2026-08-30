import assert from "node:assert/strict";
import test from "node:test";
import { parseChatCompletionEvent, readOpenAiStream } from "./openai-stream.ts";

void test("parses content, errors and DONE", () => {
  assert.deepEqual(parseChatCompletionEvent('{"choices":[{"delta":{"content":"你"}}]}'), {
    type: "delta",
    delta: "你"
  });
  assert.deepEqual(parseChatCompletionEvent("[DONE]"), { type: "done" });
  assert.deepEqual(parseChatCompletionEvent('{"error":{"message":"failed"}}'), { type: "error", message: "failed" });
});

void test("rejects malformed and unsupported SSE payloads", () => {
  assert.throws(() => parseChatCompletionEvent("{"), /聊天流返回了无效事件/);
  assert.throws(() => parseChatCompletionEvent('{"object":"chat.completion.chunk"}'), /聊天流返回了无效事件/);
  assert.throws(() => parseChatCompletionEvent('{"error":{"message":42}}'), /聊天流返回了无效事件/);
});

void test("reads events split across SSE chunks", async () => {
  const encoder = new TextEncoder();
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"你"}}]}\n'));
        controller.enqueue(encoder.encode("\ndata: [DONE]\n\n"));
        controller.close();
      }
    })
  );
  const abortController = new AbortController();
  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, [{ type: "delta", delta: "你" }, { type: "done" }]);
});

void test("reads CRLF events split across SSE chunks", async () => {
  const encoder = new TextEncoder();
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"你"}}]}\r'));
        controller.enqueue(encoder.encode("\n\r\ndata: [DONE]\r\n\r\n"));
        controller.close();
      }
    })
  );
  const abortController = new AbortController();
  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, [{ type: "delta", delta: "你" }, { type: "done" }]);
});

void test("ignores valid role-only and finish-only OpenAI events", async () => {
  const response = new Response(
    'data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{"content":"你好"},"finish_reason":null}]}\n\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n'
  );
  const abortController = new AbortController();
  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, [{ type: "delta", delta: "你好" }]);
});

void test("rejects SSE events with empty data", async () => {
  const response = new Response("data:\n\n");
  const abortController = new AbortController();

  await assert.rejects(async () => {
    const events = [];
    for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);
  }, /聊天流返回了无效事件/);
});

void test("ignores SSE comments and keepalive events without data", async () => {
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
