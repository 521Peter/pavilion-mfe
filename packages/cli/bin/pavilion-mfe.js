#!/usr/bin/env node

import { execSync } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distMain = resolve(__dirname, "../dist/index.js");

// 开发环境降级使用 tsx
try {
  await import(distMain);
} catch {
  // 从源码运行时使用 tsx
  execSync(`npx tsx ${resolve(__dirname, "../src/index.ts")} ${process.argv.slice(2).join(" ")}`, {
    stdio: "inherit"
  });
}
