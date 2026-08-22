export { createRouter } from "./create-router.js";
export { matchAppByPath, navigateTo, createPathMatcher } from "./match-app.js";
export { isPavilionMfeMainApp } from "./env.js";
export type {
  SubApp,
  SubAppLifecycle,
  AppContext,
  MainAppConfig,
  RegisteredApp,
  AppStatus,
  SubAppRouteConfig,
  RouterConfig,
  RouterHooks,
  HookContext
} from "./types.js";

// 为方便使用，重新导出 @pavilion-mfe/sandbox 的日志器
export { pavilionMfeLog, pavilionMfeError, configureLog, isLogEnabled } from "@pavilion-mfe/sandbox";
export type { LogModule, PavilionMfeLogConfig } from "@pavilion-mfe/sandbox";
