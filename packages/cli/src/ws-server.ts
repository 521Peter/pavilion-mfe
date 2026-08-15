#!/usr/bin/env node

/**
 * WebSocket server for dev port discovery.
 * Extracted from chagee's ws-server.js.
 *
 * Receives port registrations from local dev servers
 * and broadcasts the port list to connected clients (browser plugin, main app).
 */

import { WebSocketServer, WebSocket } from "ws";

const PORT = 8356;

interface PortEntry {
  port: number;
  name?: string;
}

const portList = new Map<number, PortEntry>();
const browserClients = new Set<WebSocket>();

function broadcastPortList(): void {
  const ports = Array.from(portList.values());
  const message = JSON.stringify({ action: "portList", ports });

  browserClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function startWsServer(): void {
  const wss = new WebSocketServer({ port: PORT });

  console.log(`[PavilionMfe WS] Dev discovery service started on port ${PORT}`);

  wss.on("connection", (ws, req) => {
    const isBrowser = (req.headers["sec-websocket-protocol"] ?? "") === "browser";

    if (isBrowser) {
      browserClients.add(ws);
      // Send current port list on connect
      const ports = Array.from(portList.values());
      ws.send(JSON.stringify({ action: "portList", ports }));
    }

    ws.on("message", raw => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.action === "add" && msg.port) {
          portList.set(msg.port, { port: msg.port, name: msg.name });
          console.log(`[PavilionMfe WS] Registered: ${msg.name ?? "unknown"} on port ${msg.port}`);
          broadcastPortList();
        }

        if (msg.action === "remove" && msg.port) {
          portList.delete(msg.port);
          console.log(`[PavilionMfe WS] Removed: port ${msg.port}`);
          broadcastPortList();
        }

        if (msg.action === "requestPortList") {
          const ports = Array.from(portList.values());
          ws.send(JSON.stringify({ action: "portList", ports }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      browserClients.delete(ws);
    });
  });

  wss.on("error", err => {
    if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
      console.log(`[PavilionMfe WS] Port ${PORT} already in use — discovery service already running`);
    } else {
      console.error("[PavilionMfe WS] Error:", err);
    }
  });
}

// Auto-start when this module is executed directly
if (process.argv[1]?.endsWith("ws-server.ts") || process.argv[1]?.endsWith("ws-server.js")) {
  startWsServer();
}
