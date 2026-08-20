import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import type { ConfigEnv } from "vite";
import { PavilionMfe } from "@pavilion-mfe/vite";

export default defineConfig(({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appCode = env.VITE_PAVILION_MFE_APP_CODE;
  const cdn = process.env.VITE_PAVILION_MFE_CDN || env.VITE_PAVILION_MFE_CDN || "";
  const apiBase = process.env.VITE_BASE_API_URL || env.VITE_BASE_API_URL || "";

  return {
    plugins: [
      react(),
      PavilionMfe({
        role: "sub-app",
        name: appCode,
        cdn,
        exposes: { "./main": "./src/main.tsx" },
        openDevServe: true,
        port: 6030,
        shared: [],
        dts: false
      })
    ],
    server: {
      port: 6030,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiBase || "http://localhost:3000",
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
