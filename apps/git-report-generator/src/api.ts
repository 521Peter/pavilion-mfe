import type { AvailableModel } from "./types";
import { readOpenAiStream } from "./openai-stream";

type OpenAiModelsResponse = {
  data: Array<{ id: string; display_name: string; owned_by: string }>;
};

function isOpenAiModelsResponse(value: unknown): value is OpenAiModelsResponse {
  if (typeof value !== "object" || value === null || !("data" in value) || !Array.isArray(value.data)) return false;
  return value.data.every(
    model =>
      typeof model === "object" &&
      model !== null &&
      "id" in model &&
      typeof model.id === "string" &&
      "display_name" in model &&
      typeof model.display_name === "string" &&
      "owned_by" in model &&
      typeof model.owned_by === "string"
  );
}

export async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
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

async function dataPlaneFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = sessionStorage.getItem("pavilion_token");
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Pavilion-App-Code", import.meta.env.VITE_PAVILION_MFE_APP_CODE);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401) {
    sessionStorage.removeItem("pavilion_token");
    window.location.href = "/login";
  }
  return response;
}

export async function listModels(): Promise<AvailableModel[]> {
  const response = await dataPlaneFetch("/v1/models");
  if (!response.ok) throw new Error(`模型列表请求失败（${response.status}）`);
  const json: unknown = await response.json();
  if (!isOpenAiModelsResponse(json)) throw new Error("获取模型列表返回了无效数据");
  return json.data.map(model => ({ id: model.id, displayName: model.display_name, ownedBy: model.owned_by }));
}

export async function* generateAiReport(
  body: {
    model: string;
    messages: Array<{ role: "system" | "user"; content: string }>;
    temperature: number;
    maxTokens: number;
  },
  signal: AbortSignal
): AsyncGenerator<string> {
  const response = await dataPlaneFetch("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
      stream: true
    }),
    signal
  });
  if (!response.ok || !response.body) throw new Error(`AI 报告请求失败（${response.status}）`);
  for await (const event of readOpenAiStream(response, signal)) {
    if (event.type === "delta") yield event.delta;
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "done") return;
  }
}
