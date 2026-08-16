import type { ExportedMessageRepositoryItem } from "@assistant-ui/react";
import { api, authorizedFetch } from "./http";

export type AvailableModel = {
  id: string;
  providerId: string;
  providerName: string;
  providerType: string;
  modelName: string;
  displayName: string;
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
  providerId: string;
  modelId: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

type StreamEvent = { type: "delta"; delta: string } | { type: "done" } | { type: "error"; message: string };

export async function* streamChat(body: ChatRequest, signal: AbortSignal): AsyncGenerator<string> {
  const response = await authorizedFetch("/llm/chat/stream", {
    method: "POST",
    body: JSON.stringify(body),
    signal
  });
  if (!response.ok || !response.body) throw new Error(`聊天请求失败（${response.status}）`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const eventText of events) {
      const data = eventText
        .split("\n")
        .find(line => line.startsWith("data: "))
        ?.slice(6);
      if (!data) continue;
      const event = JSON.parse(data) as StreamEvent;
      if (event.type === "delta") yield event.delta;
      if (event.type === "error") throw new Error(event.message);
    }
    if (done) break;
  }
}

export const chatApi = {
  listModels: () => api.get<AvailableModel[]>("/llm/models"),
  listThreads: () => api.get<ChatThread[]>("/llm/chat/threads"),
  createThread: (id: string) => api.post<ChatThread>("/llm/chat/threads", { id }),
  getThread: (id: string) => api.get<ChatThreadDetail>(`/llm/chat/threads/${encodeURIComponent(id)}`),
  updateThread: (id: string, data: { title?: string; status?: "regular" | "archived" }) =>
    api.patch<ChatThread>(`/llm/chat/threads/${encodeURIComponent(id)}`, data),
  deleteThread: (id: string) => api.delete(`/llm/chat/threads/${encodeURIComponent(id)}`),
  saveMessage: (threadId: string, item: ExportedMessageRepositoryItem) =>
    api.post(`/llm/chat/threads/${encodeURIComponent(threadId)}/messages/${encodeURIComponent(item.message.id)}`, item)
};
