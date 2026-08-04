import { defineConfig, loadEnv, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import { PavilionMfe } from "@pavilion-mfe/vite";
import chalk from "chalk";
import mfeConfig from "./mfe.json" with { type: "json" };

export default defineConfig(({ command, mode }: ConfigEnv) => {
  const isServe = command === "serve";
  const isBuild = command === "build";
  const env = loadEnv(mode, process.cwd(), "");
  const appCode = env.VITE_PAVILION_MFE_APP_CODE;
  const pavilionMfeEnv = env.VITE_PAVILION_MFE_ENV || "develop";
  // 优先从 process.env 读取（CI 环境变量），fallback 到 .env 文件
  const cdn =
    process.env.VITE_PAVILION_MFE_CDN || env.VITE_PAVILION_MFE_CDN || "";
  const apiBase = process.env.VITE_BASE_API_URL || env.VITE_BASE_API_URL || "";
  const deployBase =
    process.env.VITE_DEPLOY_BASE || env.VITE_DEPLOY_BASE || "/";

  console.log(
    `${chalk.green.bold("[PavilionMfe 微前端]")} ${chalk.bold(appCode)}\n` +
      `  ${chalk.gray("env")} ${chalk.cyan(pavilionMfeEnv)}  ` +
      `${chalk.gray("api")} ${chalk.cyan(apiBase || "-")}  ` +
      `${chalk.gray("cdn")} ${chalk.cyan(cdn || "(relative)")}`,
  );

  const remotes: Record<string, string> = {};

  mfeConfig.apps.forEach((app) => {
    if (isServe && app.devPort) {
      remotes[app.appCode] =
        `${app.appCode}@http://localhost:${app.devPort}/mf-manifest-main.json`;
    }
    // build mode: preloadPlugin registers remotes at runtime
  });

  return {
    plugins: [
      react(),
      PavilionMfe({
        role: "main-app",
        name: appCode,
        env: pavilionMfeEnv,
        cdn,
        remotes: isServe ? remotes : undefined,
        runtimePlugins: isBuild ? ["./src/preloadPlugin"] : undefined,
        // 显式空 shared，覆盖 rspack 自动共享 package.json 依赖的默认行为。
        // 否则主应用会把 react@19 共享给子应用，导致 React 18 子应用（react-app）
        // 的 react-dom 解析到错误版本而崩溃（ReactCurrentDispatcher undefined）。
        // 各子应用自带框架（Vue 子应用自带 vue，React 子应用自带 react）。
        shared: [],
        dts: false,
      }),
    ],
    // GitHub Pages 部署时通过 VITE_DEPLOY_BASE 设置基础路径
    // 用户页面 (username.github.io):     "/" 或不设置
    // 项目页面 (username.github.io/repo): "/<repo>/"
    base: deployBase,
    server: { port: 6019 },
    build: {
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (warning.code === "INVALID_ANNOTATION") return;
          defaultHandler(warning);
        },
      },
    },
  };
});
