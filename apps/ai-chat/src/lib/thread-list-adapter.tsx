import {
  RuntimeAdapterProvider,
  useAui,
  type ExportedMessageRepositoryItem,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
  type ThreadMessage
} from "@assistant-ui/react";
import { createAssistantStreamController } from "assistant-stream";
import { type FC, type PropsWithChildren, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "@/api/chat";

function deriveTitle(messages: readonly ThreadMessage[]): string {
  const firstUser = messages.find(m => m.role === "user");
  const text =
    firstUser?.content
      ?.filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map(c => c.text)
      .join(" ")
      .trim() ?? "新对话";
  return text.length > 30 ? text.slice(0, 30) + "…" : text;
}

function hydrateItem(item: ExportedMessageRepositoryItem): ExportedMessageRepositoryItem {
  return {
    ...item,
    message: { ...item.message, createdAt: new Date(item.message.createdAt) } as ThreadMessage
  };
}

const HistoryProvider: FC<PropsWithChildren> = ({ children }) => {
  const aui = useAui();
  const auiRef = useRef(aui);
  useEffect(() => {
    auiRef.current = aui;
  }, [aui]);

  const [history] = useState<ThreadHistoryAdapter>(() => ({
    async load() {
      const remoteId = auiRef.current.threadListItem.getState().remoteId;
      if (!remoteId) return { messages: [] };
      const thread = await chatApi.getThread(remoteId);
      return { headId: thread.headId, messages: thread.messages.map(hydrateItem) };
    },
    async append(item) {
      const { remoteId } = await auiRef.current.threadListItem.initialize();
      await chatApi.saveMessage(remoteId, item);
    },
    async update(item) {
      const { remoteId } = await auiRef.current.threadListItem.initialize();
      await chatApi.saveMessage(remoteId, item);
    }
  }));
  const adapters = useMemo(() => ({ history }), [history]);
  return <RuntimeAdapterProvider adapters={adapters}>{children}</RuntimeAdapterProvider>;
};

export function createApiThreadListAdapter(): RemoteThreadListAdapter {
  return {
    unstable_Provider: HistoryProvider,
    async list() {
      const threads = await chatApi.listThreads();
      return {
        threads: threads.map(thread => ({
          status: thread.status,
          remoteId: thread.id,
          title: thread.title,
          lastMessageAt: new Date(thread.lastMessageAt)
        }))
      };
    },
    async initialize(threadId: string) {
      const thread = await chatApi.createThread(threadId);
      return { remoteId: thread.id };
    },
    async generateTitle(remoteId: string, messages: readonly ThreadMessage[]) {
      const title = deriveTitle(messages);
      await chatApi.updateThread(remoteId, { title });
      const [stream, controller] = createAssistantStreamController();
      controller.appendText(title);
      controller.close();
      return stream;
    },
    async fetch(threadId: string) {
      const thread = await chatApi.getThread(threadId);
      return {
        status: thread.status,
        remoteId: thread.id,
        title: thread.title,
        lastMessageAt: new Date(thread.lastMessageAt)
      };
    },
    async rename(remoteId: string, newTitle: string) {
      await chatApi.updateThread(remoteId, { title: newTitle });
    },
    async archive(remoteId: string) {
      await chatApi.updateThread(remoteId, { status: "archived" });
    },
    async unarchive(remoteId: string) {
      await chatApi.updateThread(remoteId, { status: "regular" });
    },
    async delete(remoteId: string) {
      await chatApi.deleteThread(remoteId);
    }
  };
}
