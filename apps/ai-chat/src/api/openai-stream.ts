export type ChatCompletionEvent =
  | { type: "delta"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

export function parseChatCompletionEvent(data: string): ChatCompletionEvent | null {
  if (data === "[DONE]") return { type: "done" };

  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return null;
  }

  if (typeof value !== "object" || value === null) return null;
  if ("error" in value && typeof value.error === "object" && value.error !== null && "message" in value.error) {
    return typeof value.error.message === "string" ? { type: "error", message: value.error.message } : null;
  }

  if (!("choices" in value) || !Array.isArray(value.choices)) return null;
  const content = value.choices[0]?.delta?.content;
  return typeof content === "string" ? { type: "delta", delta: content } : null;
}

function eventData(eventText: string): string | undefined {
  return (
    eventText
      .split("\n")
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trimStart())
      .join("\n") || undefined
  );
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
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        const data = eventData(eventText);
        if (!data) continue;
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
