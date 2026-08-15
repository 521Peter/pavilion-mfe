import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { type FC } from "react";

export const ThreadListSidebar: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex h-full w-full flex-col bg-[#1a1a18] text-gray-100">
      <div className="flex items-center justify-between gap-2 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
            <MessageSquare className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">AI Chat</span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <ThreadListPrimitive.New className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-gray-100 transition-colors hover:bg-white/10">
          <Plus className="size-4" />
          新建对话
        </ThreadListPrimitive.New>
      </div>

      <div className="aui-scroll flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <ThreadListPrimitive.Items>{() => <ThreadListItem />}</ThreadListPrimitive.Items>
      </div>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root
      className="group/thread-item relative flex items-center gap-2 rounded-lg text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200 data-[active=true]:bg-white/10 data-[active=true]:text-white"
    >
      <ThreadListItemPrimitive.Trigger className="flex flex-1 items-center gap-2 px-3 py-2 text-left">
        <MessageSquare className="size-4 shrink-0 opacity-60" />
        <span className="flex-1 truncate">
          <ThreadListItemPrimitive.Title />
        </span>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Delete
        className="mr-1.5 flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-white/10 group-hover/thread-item:opacity-100"
        aria-label="删除对话"
      >
        <Trash2 className="size-3.5" />
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  );
};
