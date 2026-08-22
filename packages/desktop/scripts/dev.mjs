// 使用 esbuild 编译 Electron 主进程/preload TS，等待 Vite 开发服务器
//（:6019 上的主应用）可访问后，使用指向该服务器的 DEV_SERVER_URL 启动 Electron。
// MF 子应用由各自的 Vite 开发服务器（6010/6020/6030/6040）提供，
// 并在运行时解析。
import { build } from "esbuild";
import { spawn } from "node:child_process";
import waitOn from "wait-on";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "..");

const devUrl = process.env.DEV_SERVER_URL || "http://localhost:6019";

function run(bin, args, opts = {}) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(bin, args, { stdio: "inherit", shell: process.platform === "win32", ...opts });
    child.on("close", code => (code === 0 ? resolveP() : rejectP(new Error(`${bin} exited ${code}`))));
  });
}

// 将 Electron 主进程/preload 打包并压缩为 CommonJS（供 Electron 主进程使用）
function bundleMain() {
  return Promise.all([
    build({
      entryPoints: [resolve(appDir, "electron/main.ts")],
      bundle: true,
      platform: "node",
      format: "cjs",
      target: "node18",
      outfile: resolve(appDir, "dist/main.js"),
      external: ["electron"]
    }),
    build({
      entryPoints: [resolve(appDir, "electron/preload.ts")],
      bundle: true,
      platform: "node",
      format: "cjs",
      target: "node18",
      outfile: resolve(appDir, "dist/preload.js"),
      external: ["electron"]
    })
  ]);
}

try {
  console.log("[desktop] bundling electron main process...");
  await bundleMain();

  console.log(`[desktop] waiting for dev server at ${devUrl} ...`);
  await waitOn({ resources: [devUrl], timeout: 120000, validateStatus });

  console.log("[desktop] launching electron...");
  const electronBin = resolve(appDir, "node_modules/.bin/electron");
  await run(electronBin, ["."], {
    cwd: appDir,
    env: { ...process.env, DEV_SERVER_URL: devUrl }
  });
} catch (err) {
  console.error("[desktop] dev failed:", err);
  process.exit(1);
}

function validateStatus(status) {
  // Vite 开发服务器对根路径返回 200
  return status === 200;
}
