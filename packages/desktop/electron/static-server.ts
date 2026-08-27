import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import { request as httpsRequest } from "node:https";
import { join, normalize, relative, extname } from "node:path";
import { readFile, stat } from "node:fs/promises";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8"
};

/**
 * 仅使用 Node 内置模块实现的轻量静态文件服务器。
 * Module Federation 远程模块基于来源解析，因此使用真实 HTTP 来源
 *（而非 file://）可确保远程清单和 ES 模块可靠加载。
 */
function proxyApi(req: IncomingMessage, res: ServerResponse, apiBaseUrl: string): void {
  const target = new URL(req.url ?? "/api", apiBaseUrl);
  const request = target.protocol === "https:" ? httpsRequest : httpRequest;
  const headers = { ...req.headers, host: target.host };
  const proxyRequest = request(target, { method: req.method, headers }, proxyResponse => {
    res.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
    proxyResponse.pipe(res);
  });
  proxyRequest.on("error", error => {
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ code: 502, data: null, msg: `无法连接 API 服务：${error.message}` }));
  });
  req.pipe(proxyRequest);
}

export function createStaticServer(root: string, apiBaseUrl = "http://127.0.0.1:3000") {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url === "/api" || req.url?.startsWith("/api/")) {
      proxyApi(req, res, apiBaseUrl);
      return;
    }
    try {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      // SPA 降级处理：非文件请求返回 index.html
      let filePath = join(root, normalize(urlPath));
      let safe = relative(root, filePath);
      if (safe.startsWith("..") || safe.includes("\0")) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let st = await stat(filePath).catch(() => null);
      if (st?.isDirectory() || (!st && !extname(urlPath))) {
        // 优先尝试目录内的 index.html，否则降级到根目录 index.html
        const idx = st?.isDirectory() ? join(filePath, "index.html") : join(root, "index.html");
        const idxStat = await stat(idx).catch(() => null);
        if (idxStat?.isFile()) {
          filePath = idx;
        } else {
          filePath = join(root, "index.html");
        }
      }

      const data = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
        "Cache-Control": "no-cache"
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  // 端口 0 表示由操作系统选择可用端口
  return new Promise<{ port: number; close: () => void }>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        port,
        close: () => server.close()
      });
    });
  });
}
