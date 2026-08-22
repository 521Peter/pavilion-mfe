/**
 * 通过 WebSocket 发现开发服务器端口的 Vite 插件。
 * 提取自 chagee 的 vite-plugin-serve-ports-ws。
 *
 * 每个子应用开发服务器都会向中央 WS 服务注册端口，
 * 使主应用能自动发现本地运行的子应用。
 */

import type { Plugin } from "vite";

const WS_PORT = 8356;

/**
 * 创建一个 Vite 插件，在启动时将此开发服务器的端口
 * 广播到 PavilionMfe WS 发现服务。
 */
export function wsDiscoveryPlugin(
  options: {
    port?: number;
    name?: string;
  } = {}
): Plugin {
  let serverPort: number | undefined = options.port;
  let wsClient: WebSocket | null = null;

  function connectWsServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
      wsClient = ws;

      ws.onopen = () => {
        console.log(`[PavilionMfe] Connected to dev discovery service`);
        resolve();
      };

      ws.onerror = err => {
        // 独立模式下 WS 可能未运行，这是正常情况
        console.debug("[PavilionMfe] Dev discovery service not available");
        reject(err);
      };
    });
  }

  function broadcastPort(action: "add" | "remove"): void {
    if (wsClient && wsClient.readyState === WebSocket.OPEN && serverPort) {
      wsClient.send(JSON.stringify({ action, port: serverPort, name: options.name }));
    }
  }

  return {
    name: "pavilion-mfe:ws-discovery",

    async configureServer(server) {
      const resolvedPort = server.config.server.port ?? 5173;
      if (!serverPort) serverPort = resolvedPort;
      if (!options.name) options.name = `sub-app-${resolvedPort}`;

      server.httpServer?.once("listening", async () => {
        try {
          await connectWsServer();
          broadcastPort("add");
        } catch {
          // WS 发现不可用，按独立开发模式运行
        }
      });

      // 开发服务器关闭时清理。
      // closeBundle 是仅构建时触发的钩子，在开发模式下不会触发，
      // 因此改为监听 httpServer 的 'close' 事件。
      server.httpServer?.on("close", () => {
        broadcastPort("remove");
        wsClient?.close();
      });
    },

    // 保留 closeBundle 用于构建模式清理（开发模式下无操作）
    closeBundle() {
      broadcastPort("remove");
      setTimeout(() => wsClient?.close(), 200);
    }
  };
}
