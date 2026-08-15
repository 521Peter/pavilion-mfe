import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import type { ConfigEnv } from "vite";
import chalk from "chalk";
import { PavilionMfe } from "@pavilion-mfe/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appCode = env.VITE_PAVILION_MFE_APP_CODE;
  const pavilionMfeEnv = env.VITE_PAVILION_MFE_ENV || "develop";
  // 优先从 process.env 读取（CI），fallback 到 .env 文件
  const cdn =
    process.env.VITE_PAVILION_MFE_CDN || env.VITE_PAVILION_MFE_CDN || "";
  const apiBase = process.env.VITE_BASE_API_URL || env.VITE_BASE_API_URL || "";

  console.log(
    `${chalk.green.bold("[PavilionMfe 微前端]")} ${chalk.bold(appCode)}\n` +
      `  ${chalk.gray("env")} ${chalk.cyan(pavilionMfeEnv)}  ` +
      `${chalk.gray("api")} ${chalk.cyan(apiBase || "-")}  ` +
      `${chalk.gray("cdn")} ${chalk.cyan(cdn || "(relative)")}`,
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      PavilionMfe({
        role: "sub-app",
        name: appCode,
        cdn,
        exposes: {
          "./main": "./src/main.tsx",
        },
        openDevServe: true,
        port: 6020,
        shared: [],
        dts: false,
      }),
    ],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        '@': '/src',
      },
    },
    server: {
      port: 6020,
      // 独立开发时代理后端，避免 CORS（与主应用 /api 代理同构，一份请求代码两态复用）
      proxy: {
        "/api": {
          target: apiBase || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
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
