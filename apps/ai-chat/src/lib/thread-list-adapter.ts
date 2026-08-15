import { createAssistantStreamController } from "assistant-stream";
import type { RemoteThreadListAdapter } from "@assistant-ui/react";
import type { ThreadMessage } from "@assistant-ui/react";

type StoredThread = {
  remoteId: string;
  title: string;
  status: "regular" | "archived";
  lastMessageAt: Date;
};

/** In-memory store shared across the adapter instance lifetime. */
const store = new Map<string, StoredThread>();

function deriveTitle(messages: readonly ThreadMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const text =
    firstUser?.content
      ?.filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join(" ")
      .trim() ?? "新对话";
  return text.length > 30 ? text.slice(0, 30) + "…" : text;
}

export function createInMemoryThreadListAdapter(): RemoteThreadListAdapter {
  return {
    async list() {
      const threads = [...store.values()]
        .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
        .map((t) => ({
          status: t.status,
          remoteId: t.remoteId,
          title: t.title,
          lastMessageAt: t.lastMessageAt,
        }));
      return { threads };
    },

    async initialize(threadId: string) {
      if (!store.has(threadId)) {
        store.set(threadId, {
          remoteId: threadId,
          title: "新对话",
          status: "regular",
          lastMessageAt: new Date(),
        });
      }
      return { remoteId: threadId };
    },

    async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
      const title = deriveTitle(messages);
      const existing = store.get(remoteId);
      if (existing) {
        existing.title = title;
        existing.lastMessageAt = new Date();
      }
      const [stream, controller] = createAssistantStreamController();
      controller.appendText(title);
      controller.close();
      return stream;
    },

    async fetch(threadId: string) {
      const t = store.get(threadId);
      if (!t) throw new Error(`Thread "${threadId}" not found.`);
      return {
        status: t.status,
        remoteId: t.remoteId,
        title: t.title,
        lastMessageAt: t.lastMessageAt,
      };
    },

    async rename(remoteId: string, newTitle: string) {
      const t = store.get(remoteId);
      if (t) t.title = newTitle;
    },

    async archive(remoteId: string) {
      const t = store.get(remoteId);
      if (t) t.status = "archived";
    },

    async unarchive(remoteId: string) {
      const t = store.get(remoteId);
      if (t) t.status = "regular";
    },

    async delete(remoteId: string) {
      store.delete(remoteId);
    },
  };
}
