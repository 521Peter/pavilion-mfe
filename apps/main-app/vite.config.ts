import { defineConfig, loadEnv, type ConfigEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
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
  const cdn = process.env.VITE_PAVILION_MFE_CDN || env.VITE_PAVILION_MFE_CDN || "";
  const apiBase = process.env.VITE_BASE_API_URL || env.VITE_BASE_API_URL || "";
  const deployBase = process.env.VITE_DEPLOY_BASE || env.VITE_DEPLOY_BASE || "/";

  console.log(
    `${chalk.green.bold("[PavilionMfe 微前端]")} ${chalk.bold(appCode)}\n` +
      `  ${chalk.gray("env")} ${chalk.cyan(pavilionMfeEnv)}  ` +
      `${chalk.gray("api")} ${chalk.cyan(apiBase || "-")}  ` +
      `${chalk.gray("cdn")} ${chalk.cyan(cdn || "(relative)")}`
  );

  const remotes: Record<string, string> = {};

  mfeConfig.apps.forEach(app => {
    if (isServe && app.devPort) {
      remotes[app.appCode] = `${app.appCode}@http://localhost:${app.devPort}/mf-manifest-main.json`;
    }
    // build mode: preloadPlugin registers remotes at runtime
  });

  return {
    plugins: [
      react(),
      tailwindcss(),
      PavilionMfe({
        role: "main-app",
        name: appCode,
        env: pavilionMfeEnv,
        cdn,
        remotes: isServe ? remotes : undefined,
        runtimePlugins: isBuild ? ["./src/preloadPlugin"] : undefined,
        // 显式空 shared，覆盖 rspack 自动共享 package.json 依赖的默认行为。
        // 各子应用自带框架（Vue 子应用自带 vue，React 子应用自带 react），
        // 主应用不向子应用共享自身的依赖，避免版本错配。
        shared: [],
        dts: false
      })
    ],
    // GitHub Pages 部署时通过 VITE_DEPLOY_BASE 设置基础路径
    // 用户页面 (username.github.io):     "/" 或不设置
    // 项目页面 (username.github.io/repo): "/<repo>/"
    base: deployBase,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    server: {
      port: 6019,
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true
        }
      }
    },
    build: {
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (warning.code === "INVALID_ANNOTATION") return;
          defaultHandler(warning);
        }
      }
    }
  };
});
