## assistant-ui 约定

本应用使用 assistant-ui 构建聊天界面。上游文档：<https://www.assistant-ui.com/llms-full.txt>。

当前代码约定：

- 在应用根部提供 assistant-ui 运行时；
- 使用 Thread 组件实现完整聊天界面；
- 流式传输通过 `src/api/chat.ts` 对接现有 SSE 接口；
- 会话列表与消息持久化通过 `src/lib/thread-list-adapter.tsx` 对接后端；
- 修改 assistant-ui 集成前先核对当前安装版本与上游文档，不要套用 AI SDK transport 示例覆盖现有适配层。
