/** Built-in PavilionMfe routing events dispatched by createRouter.
 *  These match the event names used by window.dispatchEvent in create-router.ts. */
export enum MFEEvent {
  /** Fired before main-app routing (pushState/replaceState/popstate/init) */
  BEFORE_ROUTING = "pavilion-mfe:before-routing",
  /** Fired after main-app routing completes */
  AFTER_ROUTING = "pavilion-mfe:after-routing",
  /** Fired when switching from one sub-app to another */
  SUB_APP_SWITCH = "pavilion-mfe:sub-app-switch",
  /** Fired before a sub-app is cached (keep-alive) */
  BEFORE_CACHE = "pavilion-mfe:before-cache",
  /** Fired after a cached sub-app is restored */
  AFTER_RESTORE = "pavilion-mfe:after-restore",
  /** Fired when a sub-app encounters an error */
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
  /** Identifies the app in the bridge */
  appCode: string;
  /** 'main-app' for the main app, 'sub-app' for sub-apps */
  role: "main-app" | "sub-app";
}

export type EventCallback<T = unknown> = (detail: T) => void;

export interface Subscription {
  event: string;
  /** Unique id for tracking */
  id: string;
  unsubscribe: () => void;
}
