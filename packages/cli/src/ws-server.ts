#!/usr/bin/env node

/**
 * 用于发现开发端口的 WebSocket 服务器。
 * 提取自 chagee 的 ws-server.js。
 *
 * 接收本地开发服务器的端口注册，并将端口列表广播给已连接的客户端
 *（浏览器插件、主应用）。
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
      // 连接时发送当前端口列表
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
        // 忽略格式错误的消息
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

// 直接执行此模块时自动启动
if (process.argv[1]?.endsWith("ws-server.ts") || process.argv[1]?.endsWith("ws-server.js")) {
  startWsServer();
}
