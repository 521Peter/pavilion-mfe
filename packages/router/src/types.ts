import type { Sandbox } from "@pavilion-mfe/sandbox";

export interface SubApp {
  name: string;
  load: () => Promise<SubAppLifecycle>;
  activeWhen: (path: string) => boolean;
  /** 通过 ctx.basename 传给子应用的路由前缀（例如 '/react'） */
  basename?: string;
  /** 卸载时保留此子应用的框架实例（仅设置 display:none） */
  keepAlive?: boolean;
}

export interface SubAppLifecycle {
  bootstrap?: (ctx: AppContext) => void | Promise<void>;
  mount: (ctx: AppContext, el: HTMLElement) => (() => void) | Promise<(() => void) | void> | void;
  unmount?: (ctx: AppContext, el: HTMLElement) => void | Promise<void>;
  update?: (ctx: AppContext, props: Record<string, unknown>) => void | Promise<void>;
}

export interface AppContext {
  appCode: string;
  basename: string;
  [key: string]: unknown;
}

export interface MainAppConfig {
  apps: SubApp[];
}

export type AppStatus =
  "NOT_LOADED" | "LOADING" | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING" | "UNMOUNTED" | "CACHED"; // keep-alive：保留框架实例并设置 display:none

export interface RegisteredApp {
  name: string;
  app: () => Promise<SubAppLifecycle>;
  activeWhen: (path: string) => boolean;
  basename: string;
  status: AppStatus;
  lifecycle: SubAppLifecycle | null;
  container: HTMLElement | null;
  cleanup: (() => void) | null;
  sandbox: Sandbox | null;
}

export interface SubAppRouteConfig {
  name: string;
  routes: string[];
}

// ─── 路由器配置 ───

/** 传给路由器生命周期钩子的上下文 */
export interface HookContext {
  appCode: string;
  basename: string;
  path: string;
  trigger: "init" | "pushState" | "replaceState" | "popstate";
  ms?: number;
  error?: unknown;
}

/** 用于外部 APM / 可观测性集成的生命周期钩子 */
export interface RouterHooks {
  beforeLoad?: (ctx: HookContext) => void;
  afterLoad?: (ctx: HookContext) => void;
  beforeMount?: (ctx: HookContext) => void;
  afterMount?: (ctx: HookContext) => void;
  beforeUnmount?: (ctx: HookContext) => void;
  afterUnmount?: (ctx: HookContext) => void;
  beforeCache?: (ctx: HookContext) => void;
  afterRestore?: (ctx: HookContext) => void;
  onError?: (ctx: HookContext) => void;
}

/** createRouter 配置 */
export interface RouterConfig {
  apps?: SubApp[];
  /** 全局最多缓存的子应用数（LRU 淘汰），默认为 5 */
  maxCache?: number;
  /** 用于外部监控的生命周期钩子 */
  hooks?: RouterHooks;
}
