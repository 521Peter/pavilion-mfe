/**
 * PavilionMfe 的 Module Federation 运行时预加载插件。
 *
 * ① beforeInit：将所有子应用动态注册为 MF 远程模块
 *    （无需在 vite.config.ts 中静态声明）
 *
 * ② preload：立即加载当前子应用，延迟 1 秒后再预加载
 *    其他子应用
 */
import mfeConfig from "../mfe.json";
import { loadRemote, preloadRemote } from "@module-federation/runtime";

interface MfeApp {
  appCode: string;
  name: string;
  cdn?: string;
  routes: string[];
  devPort?: number;
  keepAlive?: boolean;
}

// ─── 内联日志器（读取与 @pavilion-mfe/sandbox 相同的全局配置） ───
// 避免在 MF 运行时初始化阶段导入 @pavilion-mfe/* 包。
const ST_PX = "color:#42b883;font-weight:bold";
const ST_MOD = "color:#00b4d8;font-weight:bold";
const ST_EVT = "color:#e8a838;font-weight:bold";
const ST_DIM = "color:#999";

function preloadLog(event: string, detail: Record<string, unknown> = {}): void {
  const g = globalThis as Record<string, any>;
  const config = g.__PAVILION_MFE_LOG__;
  if (config?.enabled === false) return;
  if (config?.modules?.preload === false) return;
  const pairs = Object.entries(detail)
    .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join("  ");
  if (pairs) {
    console.log("%c[PavilionMfe]%c preload%c %s%c %s", ST_PX, ST_MOD, ST_EVT, event, ST_DIM, pairs);
  } else {
    console.log("%c[PavilionMfe]%c preload%c %s", ST_PX, ST_MOD, ST_EVT, event);
  }
}

/**
 * 根据 URL 路径匹配子应用。
 * 使用与 createRouter 相同的尾斜杠规范化规则。
 */
function matchAppByPath(apps: MfeApp[], path: string): MfeApp | null {
  for (const app of apps) {
    if (app.routes.some(route => path.replace(/\/?$/, "/").startsWith(route.replace(/\/?$/, "/")))) {
      return app;
    }
  }
  return null;
}

/**
 * 预加载策略：
 * - 当前子应用：立即调用 loadRemote（用户正在等待）
 * - 其他子应用：延迟 1 秒后调用 preloadRemote（空闲预取）
 */
function preload(apps: MfeApp[]): void {
  const currentApp = matchAppByPath(apps, location.pathname);

  const otherApps = apps.filter(app => app.appCode !== currentApp?.appCode);

  // ① 立即加载当前子应用
  if (currentApp) {
    loadRemote(`${currentApp.appCode}/main`)
      .then(() => {
        preloadLog("preload-current", { appCode: currentApp.appCode, status: "done" });
      })
      .catch(err => {
        preloadLog("preload-current", { appCode: currentApp.appCode, status: "failed" });
        console.error(`[PavilionMfe] Preload failed for ${currentApp.appCode}:`, err);
      });
  }

  // ② 延迟预加载其他子应用
  setTimeout(() => {
    preloadRemote(
      otherApps.map(app => ({
        nameOrAlias: app.appCode,
        exposes: ["main"]
      }))
    )
      .then(() => {
        preloadLog("preload-others", { apps: otherApps.map(a => a.appCode).join(", "), status: "done" });
      })
      .catch(err => {
        preloadLog("preload-others", { status: "failed" });
        console.error("[PavilionMfe] Preload of other sub-apps failed:", err);
      });
  }, 1000);
}

export default function () {
  return {
    name: "pavilion-mfe-preload",

    /**
     * 在运行时将所有子应用注册为 MF 远程模块。
     * 子应用配置在构建时读取自 mfe.json。
     */
    beforeInit(args: any) {
      const apps = mfeConfig.apps as MfeApp[];
      const globalCdn = (import.meta.env.VITE_PAVILION_MFE_CDN || "") as string;
      args.options.remotes.push(
        ...apps.map(app => {
          const appCdn = app.cdn || globalCdn;
          const base = appCdn ? `${appCdn}` : "";
          return {
            name: app.appCode,
            entry: `${base}/mfe/${app.appCode}/mf-manifest-main.json`,
            type: "module" as const
          };
        })
      );
      preloadLog("register", {
        remotes: apps.length,
        apps: apps.map(a => a.appCode).join(", ")
      });
      // MF 运行时初始化后启动预加载
      Promise.resolve().then(() => preload(apps));
      return args;
    }
  };
}
