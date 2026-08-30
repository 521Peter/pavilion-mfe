export type ChatCompletionEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

function invalidEvent(): never {
  throw new Error("聊天流返回了无效事件");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseChatCompletionEvent(data: string): ChatCompletionEvent | null {
  if (data === "[DONE]") return { type: "done" };

  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return invalidEvent();
  }

  if (!isRecord(value)) return invalidEvent();
  if ("error" in value) {
    if (!isRecord(value.error) || typeof value.error.message !== "string") return invalidEvent();
    return { type: "error", message: value.error.message };
  }

  if (!Array.isArray(value.choices)) return invalidEvent();
  const choice = value.choices[0];
  if (!isRecord(choice)) return invalidEvent();
  const delta = choice.delta;
  if (!isRecord(delta)) return invalidEvent();

  if ("content" in delta) {
    return typeof delta.content === "string" ? { type: "delta", delta: delta.content } : invalidEvent();
  }
  if (delta.role === "assistant" && Object.keys(delta).length === 1 && choice.finish_reason === null) return null;
  if (Object.keys(delta).length === 0 && typeof choice.finish_reason === "string") return null;

  return invalidEvent();
}

function eventData(eventText: string): string | undefined {
  const dataLines = eventText.split("\n").filter(line => line.startsWith("data:"));
  if (dataLines.length === 0) return undefined;
  return dataLines.map(line => line.slice(5).trimStart()).join("\n");
}

function normalizeLineEndings(value: string, finalChunk: boolean): string {
  const normalized = value.replace(/\r\n/g, "\n");
  return finalChunk ? normalized.replace(/\r/g, "\n") : normalized.replace(/\r(?=.)/g, "\n");
}

export async function* readOpenAiStream(response: Response, signal: AbortSignal): AsyncGenerator<ChatCompletionEvent> {
  if (!response.body) throw new Error("聊天流未返回响应体");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const cancelReader = () => {
    void reader.cancel();
  };
  if (signal.aborted) cancelReader();
  signal.addEventListener("abort", cancelReader, { once: true });

  try {
    while (true) {
      if (signal.aborted) return;
      // oxlint-disable-next-line no-await-in-loop -- SSE chunks must be consumed in order.
      const { done, value } = await reader.read();
      if (signal.aborted) return;
      buffer += decoder.decode(value, { stream: !done });
      buffer = normalizeLineEndings(buffer, done);
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        const data = eventData(eventText);
        if (data === undefined) continue;
        const event = parseChatCompletionEvent(data);
        if (!event) continue;
        yield event;
      }

      if (done) break;
    }
  } finally {
    signal.removeEventListener("abort", cancelReader);
    reader.releaseLock();
  }
}
