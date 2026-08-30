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

void test("ignores OpenAI events without text content", async () => {
  const response = new Response(
    'data: {"choices":[{"delta":{"role":"assistant"}}]}\n\ndata: {"choices":[{"delta":{"content":"你好"}}]}\n\n'
  );
  const abortController = new AbortController();
  const events = [];
  for await (const event of readOpenAiStream(response, abortController.signal)) events.push(event);

  assert.deepEqual(events, [{ type: "delta", delta: "你好" }]);
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
