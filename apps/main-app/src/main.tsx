import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TabsProvider } from "@pavilion-mfe/tabs/react";
import "./tailwind.css";
import App from "./App.tsx";
import { createRouter as createPavilionMfeRouter, configureLog, createPathMatcher } from "@pavilion-mfe/router";
import mfeConfig from "../mfe.json";
import { loadRemote } from "@module-federation/runtime";
import { fetchMenus } from "./api/menu.ts";
import { deployBasePath } from "./utils/path.ts";

// ─── PavilionMfe 日志配置 ───
// 可按模块切换：router | sandbox | preload | bridge
// 将对应项设为 false 可关闭该模块的日志。
configureLog({
  enabled: true,
  modules: {
    router: true,
    sandbox: true,
    preload: true,
    bridge: true
  }
});

// ─── PavilionMfe 配置信息 ───
const appCode = import.meta.env.VITE_PAVILION_MFE_APP_CODE;
const pavilionMfeEnv = import.meta.env.VITE_PAVILION_MFE_ENV || "develop";
const apiBase = import.meta.env.VITE_BASE_API_URL || "";
const cdn = import.meta.env.VITE_PAVILION_MFE_CDN || "";

const ST_PX = "color:#42b883;font-weight:bold";
const ST_KEY = "color:#999";
const ST_VAL = "color:#00b4d8;font-weight:bold";
console.log(
  "%c[PavilionMfe 微前端]%c %s\n  %cenv%c %s  %capi%c %s  %ccdn%c %s",
  ST_PX,
  "",
  appCode,
  ST_KEY,
  ST_VAL,
  pavilionMfeEnv,
  ST_KEY,
  ST_VAL,
  apiBase || "-",
  ST_KEY,
  ST_VAL,
  cdn || "(relative)"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TabsProvider>
      <App />
    </TabsProvider>
  </StrictMode>
);

// 启动 PavilionMfe 微前端路由（子应用配置来自 mfe.json）
const pavilionMfeRouter = createPavilionMfeRouter({
  maxCache: 5,
  apps: mfeConfig.apps.map(app => ({
    name: app.appCode,
    load: async () => {
      try {
        const mod = (await loadRemote(`${app.appCode}/main`)) as any;
        return (mod as any).default ?? mod;
      } catch (err) {
        console.error(`[PavilionMfe] Failed to load ${app.appCode}:`, err);
        return {
          mount: async (_ctx: any, el: HTMLElement) => {
            el.innerHTML = `<p style="color:#999;">${app.name} 未加载</p>`;
          }
        };
      }
    },
    activeWhen: (path: string) => {
      // 去掉部署前缀后再匹配子应用路由
      // GitHub Pages 场景：path = '/pavilion-mfe/demo/list' → normalizedPath = '/demo/list'
      const normalizedPath =
        deployBasePath && path.startsWith(deployBasePath) ? path.slice(deployBasePath.length) || "/" : path;
      return createPathMatcher(app.routes)(normalizedPath);
    },
    basename: app.routes[0] ?? "",
    keepAlive: app.keepAlive ?? false
  }))
});

pavilionMfeRouter.start();

// 获取菜单数据（仅用于侧边栏渲染，与微前端子应用配置解耦）
fetchMenus();
