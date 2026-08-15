import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  type ChatModelAdapter,
  type ThreadMessage
} from "@assistant-ui/react";
import { type FC, type ReactNode, useRef } from "react";
import { createInMemoryThreadListAdapter } from "@/lib/thread-list-adapter";
import { getCurrentModel, getModelOption, type ModelId } from "@/lib/model-store";
import { ThreadListSidebar } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";

/** 模拟 AI 模型：逐字流式输出演示回复。接入真实后端时替换为 useChatRuntime + AssistantChatTransport。 */
const demoModel: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    const userText =
      (lastUser as ThreadMessage | undefined)?.content
        ?.filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map(c => c.text)
        .join(" ") ?? "";

    const model = getCurrentModel();
    const reply = buildReply(userText, model);
    // useLocalRuntime treats each yielded content as the full message content,
    // so we accumulate and re-yield the complete text on each tick.
    let accumulated = "";
    for (const ch of reply) {
      if (abortSignal.aborted) return;
      await new Promise(r => setTimeout(r, 18));
      accumulated += ch;
      yield { content: [{ type: "text", text: accumulated }] };
    }
  }
};

function buildReply(input: string, model: ModelId): string {
  const trimmed = input.trim();
  if (!trimmed) return "请输入你的问题，我会尽力帮你解答。";

  const modelName = getModelOption(model).name;
  const prefix = model === "claude-opus" ? "让我仔细分析一下。" : model === "gpt-5-mini" ? "快速回答：" : "";

  return [
    `${prefix}你刚才说：**${trimmed}**`,
    "",
    `当前使用 **${modelName}** 模型回复。这是一个演示应用，使用 @assistant-ui/react + Tailwind CSS 构建。`,
    "",
    "## 你可以",
    "- 点击左侧 **新建对话** 开启新的聊天",
    "- 悬停消息查看 **复制 / 重新生成 / 反馈** 按钮",
    "- 切换右下角的 **模型** 选择器体验不同回复风格"
  ].join("\n");
}

const RuntimeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const adapterRef = useRef<ReturnType<typeof createInMemoryThreadListAdapter> | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = createInMemoryThreadListAdapter();
  }
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () => useLocalRuntime(demoModel),
    adapter: adapterRef.current
  });
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};

function App() {
  return (
    <RuntimeProvider>
      <div className="flex h-screen w-screen overflow-hidden">
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
