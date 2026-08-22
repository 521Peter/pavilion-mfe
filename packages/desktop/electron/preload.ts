// Preload 在隔离上下文中运行，用于桥接主进程和渲染进程。
// 保持最小暴露范围，只提供渲染进程确实需要的 Node 能力。
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});
