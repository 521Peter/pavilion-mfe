import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type ThreadMessage
} from "@assistant-ui/react";
import { type FC, type ReactNode, useEffect, useRef } from "react";
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

const RuntimeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const adapterRef = useRef<ReturnType<typeof createApiThreadListAdapter> | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = createApiThreadListAdapter();
  }
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: function RuntimeHook() {
      return useLocalRuntime(platformModel);
    },
    adapter: adapterRef.current
  });
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};

function App() {
  const setModels = useModelStore(state => state.setModels);
  const setModelError = useModelStore(state => state.setError);

  useEffect(() => {
    chatApi
      .listModels()
      .then(setModels)
      .catch(error => setModelError(error instanceof Error ? error.message : "模型列表加载失败"));
  }, [setModelError, setModels]);

  return (
    <RuntimeProvider>
      <div className="flex h-full overflow-hidden">
        {/* 左侧：会话列表侧边栏 */}
        <aside className="w-64 shrink-0 border-r border-white/10">
          <ThreadListSidebar />
        </aside>

        {/* 右侧：聊天区域 */}
        <main className="flex-1 overflow-hidden">
          <Thread />
        </main>
      </div>
    </RuntimeProvider>
  );
}

export default App;
