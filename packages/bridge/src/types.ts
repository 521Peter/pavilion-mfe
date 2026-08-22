/** 由 createRouter 分发的 PavilionMfe 内置路由事件。
 *  这些事件与 create-router.ts 中 window.dispatchEvent 使用的事件名一致。 */
export enum MFEEvent {
  /** 在主应用路由（pushState/replaceState/popstate/init）前触发 */
  BEFORE_ROUTING = "pavilion-mfe:before-routing",
  /** 在主应用路由完成后触发 */
  AFTER_ROUTING = "pavilion-mfe:after-routing",
  /** 从一个子应用切换到另一个子应用时触发 */
  SUB_APP_SWITCH = "pavilion-mfe:sub-app-switch",
  /** 子应用进入缓存（keep-alive）前触发 */
  BEFORE_CACHE = "pavilion-mfe:before-cache",
  /** 已缓存的子应用恢复后触发 */
  AFTER_RESTORE = "pavilion-mfe:after-restore",
  /** 子应用发生错误时触发 */
  SUB_APP_ERROR = "pavilion-mfe:sub-app-error"
}

export interface RouteChangeDetail {
  matched: string[];
  componentName?: string;
  name?: string;
  href: string;
  fullPath: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  meta: Record<string, unknown>;
}

export interface SwitchAppDetail {
  previousApp?: { appCode?: string };
  nextApp?: { appCode?: string };
}

export interface BridgeOptions {
  /** 标识桥接通信中的应用 */
  appCode: string;
  /** 主应用使用 'main-app'，子应用使用 'sub-app' */
  role: "main-app" | "sub-app";
}

export type EventCallback<T = unknown> = (detail: T) => void;

export interface Subscription {
  event: string;
  /** 用于追踪的唯一 ID */
  id: string;
  unsubscribe: () => void;
}
