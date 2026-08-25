import type { AvailableModel } from "./types";

interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}
type StreamEvent = { type: "delta"; delta: string } | { type: "done" } | { type: "error"; message: string };

async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };
  const token = sessionStorage.getItem("pavilion_token");
  if (token) headers.Authorization = `Bearer ${token}`;
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
  const json = (await response.json()) as ApiResponse<AvailableModel[]>;
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
      const event = JSON.parse(raw) as StreamEvent;
      if (event.type === "delta") yield event.delta;
      if (event.type === "error") throw new Error(event.message);
    }
    if (done) break;
  }
}
