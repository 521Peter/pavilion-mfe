#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const TEMPLATES: Record<string, Record<string, string>> = {
  "sub-app-main.ts": {
    path: "src/sub-app-main.ts",
    content: `/**
 * PavilionMfe 子应用生命周期入口。
 * 导出 mount/unmount 供主应用加载。
 */
export default {
  mount: async (ctx: { appCode: string; basename: string }, el: HTMLElement) => {
    // 在此实现挂载逻辑
    el.innerHTML = '<h1>Hello from PavilionMfe!</h1>'
  },
  unmount: async () => {
    // 清理
  },
}
`
  },
  "vite.config.ts": {
    path: "vite.config.ts",
    content: `import { defineConfig } from 'vite'
import { PavilionMfe } from '@pavilion-mfe/vite'

export default defineConfig({
  plugins: [
    PavilionMfe({
      role: 'sub-app',
      name: process.env.npm_package_name ?? 'my-app',
      exposes: { './main': './src/sub-app-main.ts' },
      shared: [],
    }),
  ],
})
`
  },
  VERSION: {
    path: "VERSION",
    content: "0.1.0\n"
  },
  "package.json": {
    path: "package.json",
    content: JSON.stringify(
      {
        name: "my-pavilion-mfe-sub-app",
        version: "0.1.0",
        private: true,
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          "build:mfe": "vite build --mode mfe"
        }
      },
      null,
      2
    )
  },
  "index.html": {
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>My PavilionMfe Sub-App</title></head>
<body><div id="app"></div><script type="module" src="/src/main.ts"></script></body>
</html>
`
  }
};

async function main(): Promise<void> {
  const projectName = process.argv[2] ?? "my-pavilion-mfe-app";
  const projectDir = resolve(process.cwd(), projectName);

  if (existsSync(projectDir)) {
    console.error(`Directory ${projectName} already exists.`);
    process.exit(1);
  }

  mkdirSync(projectDir, { recursive: true });
  mkdirSync(resolve(projectDir, "src"));

  for (const [, template] of Object.entries(TEMPLATES)) {
    const filePath = resolve(projectDir, template.path);
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, template.content, "utf-8");
  }

  console.log(`✅ Created PavilionMfe app at ${projectDir}`);
  console.log();
  console.log("  cd", projectName);
  console.log("  npm install");
  console.log("  npm run dev");
}

main().catch(console.error);
