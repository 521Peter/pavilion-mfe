import type { ExportedMessageRepositoryItem } from "@assistant-ui/react";
import { api, dataPlaneFetch } from "./http";
import { readOpenAiStream } from "./openai-stream";

export type VirtualModelOption = {
  id: string;
  displayName: string;
  ownedBy: string;
};

export type ChatThread = {
  id: string;
  title: string;
  status: "regular" | "archived";
  lastMessageAt: string;
};

export type ChatThreadDetail = ChatThread & {
  headId?: string | null;
  messages: ExportedMessageRepositoryItem[];
};

export type ChatRequest = {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

type OpenAiModelsResponse = {
  data: Array<{ id: string; display_name: string; owned_by: string }>;
};

export async function* streamChat(body: ChatRequest, signal: AbortSignal): AsyncGenerator<string> {
  const response = await dataPlaneFetch("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({ model: body.model, messages: body.messages, stream: true }),
    signal
  });
  if (!response.ok || !response.body) throw new Error(`聊天请求失败（${response.status}）`);

  for await (const event of readOpenAiStream(response, signal)) {
    if (event.type === "delta") yield event.delta;
    if (event.type === "error") throw new Error(event.message);
    if (event.type === "done") return;
  }
}

export const chatApi = {
  listModels: async (): Promise<VirtualModelOption[]> => {
    const response = await dataPlaneFetch("/v1/models");
    if (!response.ok) throw new Error(`模型列表请求失败（${response.status}）`);
    const result: OpenAiModelsResponse = await response.json();
    return result.data.map(model => ({ id: model.id, displayName: model.display_name, ownedBy: model.owned_by }));
  },
  listThreads: () => api.get<ChatThread[]>("/llm/chat/threads"),
  createThread: (id: string) => api.post<ChatThread>("/llm/chat/threads", { id }),
  getThread: (id: string) => api.get<ChatThreadDetail>(`/llm/chat/threads/${encodeURIComponent(id)}`),
  updateThread: (id: string, data: { title?: string; status?: "regular" | "archived" }) =>
    api.patch<ChatThread>(`/llm/chat/threads/${encodeURIComponent(id)}`, data),
  deleteThread: (id: string) => api.delete(`/llm/chat/threads/${encodeURIComponent(id)}`),
  saveMessage: (threadId: string, item: ExportedMessageRepositoryItem) =>
    api.post(`/llm/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(item.message.id)}`, item)
};
