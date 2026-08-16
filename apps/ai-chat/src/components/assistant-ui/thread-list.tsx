import { ThreadListItemPrimitive, ThreadListPrimitive } from "@assistant-ui/react";
import { MessageSquare, PanelLeftClose, Sparkles, SquarePen, Trash2 } from "lucide-react";
import { type FC } from "react";

export const ThreadListSidebar: FC<{ onClose: () => void; onNavigate: () => void }> = ({
  onClose,
  onNavigate
}) => {
  return (
    <ThreadListPrimitive.Root className="flex h-full w-full flex-col bg-[#f7f7f8] text-gray-900">
      <div className="flex h-14 items-center justify-between px-3">
        <div className="flex size-10 items-center justify-center text-indigo-500" aria-hidden="true">
          <Sparkles className="size-5 fill-indigo-500" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="折叠会话侧边栏"
          title="折叠侧边栏"
          className="flex size-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-200/70 hover:text-gray-950 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
        >
          <PanelLeftClose className="size-5" />
        </button>
      </div>

      <div className="px-2 pb-3">
        <ThreadListPrimitive.New
          onClick={onNavigate}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-200/70 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none"
        >
          <SquarePen className="size-4.5 text-gray-600" />
          新建对话
        </ThreadListPrimitive.New>
      </div>

      <div className="px-4 pb-2 text-xs font-medium text-gray-500">对话记录</div>
      <div className="aui-scroll flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        <ThreadListPrimitive.Items>{() => <ThreadListItem onNavigate={onNavigate} />}</ThreadListPrimitive.Items>
      </div>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListItem: FC<{ onNavigate: () => void }> = ({ onNavigate }) => {
  return (
    <ThreadListItemPrimitive.Root className="group/thread-item relative flex min-h-11 items-center gap-1 rounded-xl text-sm text-gray-700 transition-colors hover:bg-gray-200/70 data-[active=true]:bg-gray-200 data-[active=true]:text-gray-950">
      <ThreadListItemPrimitive.Trigger
        onClick={onNavigate}
        className="flex min-w-0 flex-1 items-center gap-2.5 self-stretch px-3 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400 focus-visible:outline-none"
      >
        <MessageSquare className="size-4 shrink-0 text-gray-500" />
        <span className="flex-1 truncate">
          <ThreadListItemPrimitive.Title />
        </span>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Delete
        className="mr-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-500 opacity-0 transition hover:bg-gray-300/80 hover:text-red-600 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:outline-none group-hover/thread-item:opacity-100"
        aria-label="删除对话"
        title="删除对话"
      >
        <Trash2 className="size-3.5" />
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  );
};
