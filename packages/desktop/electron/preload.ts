// Preload runs in an isolated context bridging the main process and renderer.
// Keep it minimal — only expose what the renderer genuinely needs from Node.
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});
