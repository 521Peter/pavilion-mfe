/**
 * Vite plugin for dev-server port discovery via WebSocket.
 * Extracted from chagee's vite-plugin-serve-ports-ws.
 *
 * Each sub-app dev server registers its port with a central WS service,
 * so the main app can auto-discover locally running sub-apps.
 */

import type { Plugin } from "vite";

const WS_PORT = 8356;

/**
 * Creates a Vite plugin that broadcasts this dev server's port
 * to the PavilionMfe WS discovery service on start.
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
        // WS may not be running in standalone mode — that's fine
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
          // WS discovery not available — dev standalone
        }
      });

      // Clean up on dev server close.
      // closeBundle is a build-only hook — it never fires in dev mode,
      // so we listen on httpServer 'close' instead.
      server.httpServer?.on("close", () => {
        broadcastPort("remove");
        wsClient?.close();
      });
    },

    // Keep closeBundle for build-mode cleanup (no-op in dev)
    closeBundle() {
      broadcastPort("remove");
      setTimeout(() => wsClient?.close(), 200);
    }
  };
}
