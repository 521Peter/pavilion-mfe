import type { AvailableModel } from "./types";

type StreamEvent = { type: "delta"; delta: string } | { type: "done" } | { type: "error"; message: string };

function isAvailableModel(value: unknown): value is AvailableModel {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "providerId" in value &&
    typeof value.providerId === "string" &&
    "providerName" in value &&
    typeof value.providerName === "string" &&
    "providerType" in value &&
    typeof value.providerType === "string" &&
    "modelName" in value &&
    typeof value.modelName === "string" &&
    "displayName" in value &&
    typeof value.displayName === "string"
  );
}

function readStreamEvent(value: unknown): StreamEvent | null {
  if (typeof value !== "object" || value === null || !("type" in value) || typeof value.type !== "string") return null;
  if (value.type === "done") return { type: "done" };
  if (value.type === "delta" && "delta" in value && typeof value.delta === "string") {
    return { type: "delta", delta: value.delta };
  }
  if (value.type === "error" && "message" in value && typeof value.message === "string") {
    return { type: "error", message: value.message };
  }
  return null;
}

async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = sessionStorage.getItem("pavilion_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...options, headers });
  if (response.status === 401) {
    sessionStorage.removeItem("pavilion_token");
    window.location.href = "/login";
    throw new Error("登录已过期，请重新登录");
  }
  return response;
}

export async function listModels(): Promise<AvailableModel[]> {
  const response = await authorizedFetch("/llm/models");
  const json: unknown = await response.json();
  if (
    typeof json !== "object" ||
    json === null ||
    !("code" in json) ||
    typeof json.code !== "number" ||
    !("msg" in json) ||
    typeof json.msg !== "string" ||
    !("data" in json) ||
    !Array.isArray(json.data) ||
    !json.data.every(isAvailableModel)
  ) {
    throw new Error("获取模型列表返回了无效数据");
  }
  if (!response.ok || json.code !== 0) throw new Error(json.msg || "获取模型列表失败");
  return json.data;
}

export async function* generateAiReport(
  body: {
    providerId: string;
    modelId: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    temperature: number;
    maxTokens: number;
  },
  signal: AbortSignal
): AsyncGenerator<string> {
  const response = await authorizedFetch("/llm/chat/stream", {
    method: "POST",
    body: JSON.stringify(body),
    signal
  });
  if (!response.ok || !response.body) throw new Error(`AI 报告请求失败（${response.status}）`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const eventText of events) {
      const raw = eventText
        .split("\n")
        .find(line => line.startsWith("data: "))
        ?.slice(6);
      if (!raw) continue;
      const event = readStreamEvent(JSON.parse(raw));
      if (!event) throw new Error("AI 报告流返回了无效事件");
      if (event.type === "delta") yield event.delta;
      if (event.type === "error") throw new Error(event.message);
    }
    if (done) break;
  }
}
