import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
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
 * Lightweight static file server using only Node built-ins.
 * Module Federation remotes resolve against the origin, so a real HTTP origin
 * (rather than file://) keeps remote manifests / ES modules loading reliably.
 */
export function createStaticServer(root: string) {
  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      // SPA fallback: non-file requests serve index.html
      let filePath = join(root, normalize(urlPath));
      let safe = relative(root, filePath);
      if (safe.startsWith("..") || safe.includes("\0")) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let st = await stat(filePath).catch(() => null);
      if (st?.isDirectory() || (!st && !extname(urlPath))) {
        // Try index.html inside directory, else SPA fallback to root index
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
    } catch (err) {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  // Port 0 lets the OS pick an available port
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
