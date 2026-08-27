import {
  AssistantRuntimeProvider,
  ThreadListPrimitive,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type ThreadMessage
} from "@assistant-ui/react";
import { PanelLeftOpen, SquarePen } from "lucide-react";
import { type FC, type ReactNode, useCallback, useEffect, useState } from "react";
import { createApiThreadListAdapter } from "@/lib/thread-list-adapter";
import { getCurrentModel, useModelStore } from "@/lib/model-store";
import { ThreadListSidebar } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";
import { chatApi, streamChat } from "@/api/chat";

function messageText(message: ThreadMessage): string {
  return message.content
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map(part => part.text)
    .join("\n");
}

const platformModel: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const model = getCurrentModel();
    if (!model) throw new Error("暂无可用模型，请先在平台配置中启用模型");

    let accumulated = "";
    const requestMessages = messages
      .filter(message => message.role === "system" || message.role === "user" || message.role === "assistant")
      .map(message => ({ role: message.role, content: messageText(message) }));

    for await (const chunk of streamChat(
      { providerId: model.providerId, modelId: model.id, messages: requestMessages },
      abortSignal
    )) {
      accumulated += chunk;
      yield { content: [{ type: "text", text: accumulated }] };
    }
  }
};

function usePlatformRuntime() {
  return useLocalRuntime(platformModel);
}

function getThreadIdFromPath(pathname = window.location.pathname): string | undefined {
  const match = pathname.match(/\/chat\/([^/]+)\/?$/);
  if (!match?.[1]) return undefined;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }
}

function getThreadPath(threadId: string | undefined): string {
  const match = window.location.pathname.match(/\/chat(?:\/|$)/);
  const prefix = match?.index === undefined ? "" : window.location.pathname.slice(0, match.index);
  return threadId ? `${prefix}/chat/${encodeURIComponent(threadId)}` : `${prefix}/chat`;
}

const RuntimeProvider: FC<{ children: ReactNode; onThreadNavigate: () => void }> = ({ children, onThreadNavigate }) => {
  const [adapter] = useState(createApiThreadListAdapter);
  const [threadId, setThreadId] = useState(getThreadIdFromPath);

  const handleThreadIdChange = useCallback(
    (nextThreadId: string | undefined) => {
      setThreadId(nextThreadId);
      const nextPath = getThreadPath(nextThreadId);
      if (window.location.pathname !== nextPath) {
        window.history.pushState(
          window.history.state,
          "",
          `${nextPath}${window.location.search}${window.location.hash}`
        );
      }
      onThreadNavigate();
    },
    [onThreadNavigate]
  );

  useEffect(() => {
    const syncThreadFromUrl = () => setThreadId(getThreadIdFromPath());
    window.addEventListener("popstate", syncThreadFromUrl);
    window.addEventListener("pavilion-mfe:after-routing", syncThreadFromUrl);
    return () => {
      window.removeEventListener("popstate", syncThreadFromUrl);
      window.removeEventListener("pavilion-mfe:after-routing", syncThreadFromUrl);
    };
  }, []);

  const runtime = useRemoteThreadListRuntime({
    // oxlint-disable-next-line react/hooks -- assistant-ui requires a custom Hook reference as runtimeHook
    runtimeHook: usePlatformRuntime,
    adapter,
    threadId,
    onThreadIdChange: handleThreadIdChange
  });
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};

const CollapsedSidebarRail: FC<{ onOpen: () => void; onNew: () => void }> = ({ onOpen, onNew }) => (
  <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-gray-200/80 bg-white py-2">
    <button
      type="button"
      onClick={onOpen}
      className="flex size-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
      aria-label="打开会话侧边栏"
      title="打开侧边栏"
    >
      <PanelLeftOpen className="size-5" />
    </button>
    <ThreadListPrimitive.New
      onClick={onNew}
      className="flex size-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
      aria-label="新建对话"
      title="新建对话"
    >
      <SquarePen className="size-5" />
    </ThreadListPrimitive.New>
  </aside>
);

function App() {
  const setModels = useModelStore(state => state.setModels);
  const setModelError = useModelStore(state => state.setError);
  const [isNarrow, setIsNarrow] = useState(() => window.matchMedia("(max-width: 1023px)").matches);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !window.matchMedia("(max-width: 1023px)").matches);

  useEffect(() => {
    chatApi
      .listModels()
      .then(setModels)
      .catch(error => setModelError(error instanceof Error ? error.message : "模型列表加载失败"));
  }, [setModelError, setModels]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsNarrow(event.matches);
      setIsSidebarOpen(!event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!isNarrow || !isSidebarOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNarrow, isSidebarOpen]);

  useEffect(() => {
    const closeOnRouteChange = () => {
      if (isNarrow) setIsSidebarOpen(false);
    };
    window.addEventListener("popstate", closeOnRouteChange);
    window.addEventListener("pavilion-mfe:before-routing", closeOnRouteChange);
    return () => {
      window.removeEventListener("popstate", closeOnRouteChange);
      window.removeEventListener("pavilion-mfe:before-routing", closeOnRouteChange);
    };
  }, [isNarrow]);

  const closeNarrowSidebar = useCallback(() => {
    if (isNarrow) setIsSidebarOpen(false);
  }, [isNarrow]);

  return (
    <RuntimeProvider onThreadNavigate={closeNarrowSidebar}>
      <div className="relative flex h-full overflow-hidden bg-white">
        {isNarrow ? (
          <>
            <button
              type="button"
              aria-label="关闭会话侧边栏"
              className={`absolute inset-0 z-30 bg-black/25 transition-opacity duration-200 ${
                isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              onClick={() => setIsSidebarOpen(false)}
            />
            <aside
              aria-hidden={!isSidebarOpen}
              inert={!isSidebarOpen}
              className={`absolute inset-y-0 left-0 z-40 w-[280px] max-w-[calc(100%-3rem)] transform transition-transform duration-200 ease-out ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <ThreadListSidebar onClose={() => setIsSidebarOpen(false)} onNavigate={closeNarrowSidebar} />
            </aside>
          </>
        ) : isSidebarOpen ? (
          <aside className="w-[280px] shrink-0 border-r border-gray-200/80">
            <ThreadListSidebar onClose={() => setIsSidebarOpen(false)} onNavigate={closeNarrowSidebar} />
          </aside>
        ) : null}

        {!isSidebarOpen ? (
          <CollapsedSidebarRail onOpen={() => setIsSidebarOpen(true)} onNew={closeNarrowSidebar} />
        ) : null}

        <main className="relative min-w-0 flex-1 overflow-hidden">
          <Thread />
        </main>
      </div>
    </RuntimeProvider>
  );
}

export default App;
