import {
  ActionBarPrimitive,
  AuiIf,
  AttachmentPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive
} from "@assistant-ui/react";
import {
  ArrowUpIcon,
  CheckIcon,
  ClipboardIcon,
  Code as CodeIcon,
  GraduationCap,
  MessageSquare,
  PencilIcon,
  PenLine,
  PlusIcon,
  RefreshCwIcon,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  XIcon
} from "lucide-react";
import { type FC } from "react";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { useModelStore } from "@/lib/model-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-white dark:bg-[#16171d]">
      <AuiIf condition={s => s.thread.isEmpty}>
        <EmptyState />
      </AuiIf>

      <AuiIf condition={s => !s.thread.isEmpty}>
        <ThreadPrimitive.Viewport className="aui-scroll flex grow flex-col overflow-y-auto">
          <ThreadPrimitive.Messages>{() => <ChatMessage />}</ThreadPrimitive.Messages>

          <ThreadPrimitive.ViewportFooter className="sticky bottom-0 mx-auto mt-auto w-full max-w-3xl bg-gradient-to-b from-transparent via-white/85 to-white px-4 pt-4 pb-2 dark:via-[#16171d]/85 dark:to-[#16171d]">
            <Composer />
            <p className="pt-2 text-center text-xs text-gray-400 dark:text-gray-500">AI 可能会犯错，请核对重要信息。</p>
          </ThreadPrimitive.ViewportFooter>
        </ThreadPrimitive.Viewport>
      </AuiIf>
    </ThreadPrimitive.Root>
  );
};

const EmptyState: FC = () => {
  return (
    <div className="flex grow flex-col items-center justify-center px-4 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-stretch gap-6">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-semibold text-gray-900 sm:text-4xl dark:text-gray-50">
          <Sparkles className="size-7 fill-indigo-500 text-indigo-500" />
          <span>有什么可以帮你的？</span>
        </h1>
        <Composer />
        <ModeTabs />
      </div>
    </div>
  );
};

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="flex w-full flex-col gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 pt-3 pb-2.5 shadow-sm dark:border-gray-700 dark:bg-[#1f2028]">
      <ComposerPrimitive.Input
        placeholder="输入你的问题..."
        rows={1}
        className="block max-h-72 min-h-6 w-full resize-none bg-transparent text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
      />

      <div className="flex w-full items-center gap-2">
        <ComposerPrimitive.AddAttachment
          aria-label="添加附件"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100"
        >
          <PlusIcon width={16} height={16} />
        </ComposerPrimitive.AddAttachment>

        <div className="ml-auto flex items-center gap-1">
          <ModelPicker />
          <ComposerPrimaryAction />
        </div>
      </div>

      <AuiIf condition={s => s.composer.attachments.length > 0}>
        <div className="-mx-1 -mb-1 flex flex-row gap-2 overflow-x-auto pt-1">
          <ComposerPrimitive.Attachments>{() => <ChatAttachment />}</ComposerPrimitive.Attachments>
        </div>
      </AuiIf>
    </ComposerPrimitive.Root>
  );
};

const ComposerPrimaryAction: FC = () => {
  const hasModel = useModelStore(state => Boolean(state.currentId));
  return (
    <>
      <AuiIf condition={s => s.thread.isRunning}>
        <ComposerPrimitive.Cancel className="flex size-8 items-center justify-center rounded-md bg-indigo-500 text-white transition-colors hover:bg-indigo-600">
          <div className="size-2.5 rounded-[2px] bg-current" />
        </ComposerPrimitive.Cancel>
      </AuiIf>

      <AuiIf condition={s => !s.thread.isRunning && !s.composer.isEmpty}>
        <ComposerPrimitive.Send
          disabled={!hasModel}
          title={hasModel ? "发送" : "请先配置可用模型"}
          className="flex size-8 items-center justify-center rounded-md bg-indigo-500 text-white transition-colors hover:bg-indigo-600 disabled:pointer-events-none disabled:opacity-50"
        >
          <ArrowUpIcon width={16} height={16} />
        </ComposerPrimitive.Send>
      </AuiIf>

      <AuiIf condition={s => !s.thread.isRunning && s.composer.isEmpty}>
        <ComposerPrimitive.Send
          disabled
          className="flex size-8 items-center justify-center rounded-md bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
        >
          <ArrowUpIcon width={16} height={16} />
        </ComposerPrimitive.Send>
      </AuiIf>
    </>
  );
};

const ModelPicker: FC = () => {
  const { models, currentId, error, setCurrent } = useModelStore();
  const currentOption = models.find(model => model.id === currentId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title={error}
        className="flex h-8 items-center gap-1 rounded-md px-2.5 text-sm whitespace-nowrap text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5"
      >
        <span>{currentOption?.displayName ?? "暂无模型"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        {models.length === 0 ? <DropdownMenuItem disabled>{error ?? "正在加载模型…"}</DropdownMenuItem> : null}
        {models.map(m => (
          <DropdownMenuItem key={m.id} className="flex items-start gap-3" onClick={() => setCurrent(m.id)}>
            <span className="mt-0.5 flex size-4 items-center justify-center text-indigo-500">
              {m.id === currentId ? <CheckIcon className="size-4" /> : null}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.displayName}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {m.providerName} · {m.modelName}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ModeTabs: FC = () => {
  const tabs = [
    { label: "写作", Icon: PenLine },
    { label: "学习", Icon: GraduationCap },
    { label: "代码", Icon: CodeIcon },
    { label: "聊天", Icon: MessageSquare }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {tabs.map(({ label, Icon }) => (
        <button
          key={label}
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-transparent px-3 text-sm whitespace-nowrap text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <Icon className="size-3.5 text-gray-400 dark:text-gray-500" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

const messageActionButtonClassName =
  "flex size-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-100";

const ChatMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="group/message relative mx-auto flex w-full max-w-3xl flex-col px-4 py-2">
      <AuiIf condition={s => s.message.role === "user"}>
        <div className="flex flex-col items-end gap-1">
          <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2.5 whitespace-pre-wrap text-gray-900 dark:bg-gray-700 dark:text-gray-100">
            <MessagePrimitive.Parts>
              {({ part }) => {
                if (part.type === "text") return <MarkdownText />;
                return null;
              }}
            </MessagePrimitive.Parts>
          </div>
          <ActionBarPrimitive.Root className="-mt-px flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
            <ActionBarPrimitive.Edit className={messageActionButtonClassName}>
              <PencilIcon width={16} height={16} />
            </ActionBarPrimitive.Edit>
            <ActionBarPrimitive.Copy className={messageActionButtonClassName}>
              <AuiIf condition={s => s.message.isCopied}>
                <CheckIcon className="size-4" />
              </AuiIf>
              <AuiIf condition={s => !s.message.isCopied}>
                <ClipboardIcon width={16} height={16} />
              </AuiIf>
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      </AuiIf>

      <AuiIf condition={s => s.message.role === "assistant"}>
        <div className="flex flex-col">
          <div className="prose prose-sm max-w-none leading-relaxed text-gray-900 dark:text-gray-100 dark:prose-invert">
            <MessagePrimitive.Parts>
              {({ part }) => {
                if (part.type === "text") return <MarkdownText />;
                return null;
              }}
            </MessagePrimitive.Parts>
          </div>
          <ActionBarPrimitive.Root className="mt-2 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within/message:opacity-100 group-hover/message:opacity-100">
            <ActionBarPrimitive.Copy className={messageActionButtonClassName}>
              <AuiIf condition={s => s.message.isCopied}>
                <CheckIcon className="size-4" />
              </AuiIf>
              <AuiIf condition={s => !s.message.isCopied}>
                <ClipboardIcon width={16} height={16} />
              </AuiIf>
            </ActionBarPrimitive.Copy>
            <ActionBarPrimitive.FeedbackPositive className={messageActionButtonClassName}>
              <ThumbsUp className="size-4" />
            </ActionBarPrimitive.FeedbackPositive>
            <ActionBarPrimitive.FeedbackNegative className={messageActionButtonClassName}>
              <ThumbsDown className="size-4" />
            </ActionBarPrimitive.FeedbackNegative>
            <ActionBarPrimitive.Reload className={messageActionButtonClassName}>
              <RefreshCwIcon width={16} height={16} />
            </ActionBarPrimitive.Reload>
          </ActionBarPrimitive.Root>
        </div>
      </AuiIf>
    </MessagePrimitive.Root>
  );
};

const ChatAttachment: FC = () => {
  return (
    <AttachmentPrimitive.Root className="group/thumbnail relative">
      <div
        className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
        style={{ width: "80px", height: "80px" }}
      >
        <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
          <AttachmentPrimitive.unstable_Thumb className="text-xs" />
        </div>
      </div>
      <AttachmentPrimitive.Remove
        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-gray-900 text-white opacity-0 transition-opacity group-focus-within/thumbnail:opacity-100 group-hover/thumbnail:opacity-100 hover:bg-gray-700 dark:bg-white dark:text-gray-900"
        aria-label="移除附件"
      >
        <XIcon width={12} height={12} />
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  );
};
