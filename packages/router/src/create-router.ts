import type { SubApp, RegisteredApp, RouterConfig, RouterHooks, HookContext } from "./types.js";
import { Sandbox, setRouteMatcher, pavilionMfeLog } from "@pavilion-mfe/sandbox";

/**
 * Micro-frontend lifecycle router.
 * Extracted from chagee's routerManager.js.
 *
 * Manages loading → bootstrap → mount → unmount lifecycle
 * for multiple sub-apps based on URL path matching.
 * Attaches Sandbox isolation on mount, cleans up on unmount.
 */
export function createRouter(config?: RouterConfig) {
  const apps: RegisteredApp[] = [];
  let prevActiveAppCodes: string[] = [];
  const maxCache = config?.maxCache ?? 5;
  const hooks: RouterHooks | undefined = config?.hooks;

  // Track keep-alive preference and cache metadata per app
  const keepAliveMap = new Map<string, { keepAlive: boolean; cachedAt: number }>();

  /**
   * Dispatch a PavilionMfe routing event.
   * Events: pavilion-mfe:before-routing, pavilion-mfe:after-routing, pavilion-mfe:sub-app-switch,
   *         pavilion-mfe:before-cache, pavilion-mfe:after-restore, pavilion-mfe:sub-app-error
   */
  function dispatch(name: string, detail: Record<string, unknown>): void {
    pavilionMfeLog("router", name.replace("pavilion-mfe:", ""), detail);
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** Build a HookContext for the current routing trigger */
  let currentTrigger: HookContext["trigger"] = "init";
  let currentPath = "";

  function makeHookCtx(app: RegisteredApp, ms?: number, error?: unknown): HookContext {
    return {
      appCode: app.name,
      basename: app.basename,
      path: currentPath || window.location.pathname,
      trigger: currentTrigger,
      ms,
      error
    };
  }

  if (config?.apps) {
    config.apps.forEach(app => register(app));
  }

  function register(app: SubApp): void {
    apps.push({
      name: app.name,
      app: app.load,
      activeWhen: app.activeWhen,
      basename: app.basename ?? "",
      status: "NOT_LOADED",
      lifecycle: null,
      container: null,
      cleanup: null,
      sandbox: null
    });
    keepAliveMap.set(app.name, {
      keepAlive: app.keepAlive ?? false,
      cachedAt: 0
    });
    pavilionMfeLog("router", "sub-app-register", {
      appCode: app.name,
      keepAlive: app.keepAlive ?? false,
      basename: app.basename ?? ""
    });
  }

  function getContainer(name: string): HTMLElement {
    const existing = document.getElementById(name);
    if (existing) return existing;

    const div = document.createElement("div");
    div.id = name;
    div.classList.add(`pavilion-mfe-${name}`);
    document.getElementById("pavilion-mfe-container")?.appendChild(div);
    return div;
  }

  function matchActiveApps(): RegisteredApp[] {
    const path = window.location.pathname;
    return apps.filter(app => app.activeWhen(path));
  }

  async function loadApp(app: RegisteredApp): Promise<void> {
    if (app.status !== "NOT_LOADED") return;
    app.status = "LOADING";
    const t0 = performance.now();
    hooks?.beforeLoad?.(makeHookCtx(app));
    try {
      app.lifecycle = await app.app();
      if (app.lifecycle.bootstrap) {
        await app.lifecycle.bootstrap({ appCode: app.name, basename: "" });
      }
      app.status = "NOT_MOUNTED";
      const ms = Math.round(performance.now() - t0);
      pavilionMfeLog("router", "sub-app-load", { appCode: app.name, ms });
      hooks?.afterLoad?.(makeHookCtx(app, ms));
    } catch (err) {
      const ms = Math.round(performance.now() - t0);
      pavilionMfeLog("router", "sub-app-error", { appCode: app.name, phase: "load", error: String(err) });
      dispatch("pavilion-mfe:sub-app-error", { appCode: app.name, phase: "load", error: String(err), ms });
      hooks?.onError?.(makeHookCtx(app, ms, err));
      app.status = "NOT_LOADED";
    }
  }

  /**
   * Restore a CACHED app: re-show container + re-activate sandbox.
   * Framework instance is still alive — skip mount().
   */
  async function restoreApp(app: RegisteredApp): Promise<void> {
    if (app.status !== "CACHED") return;
    hooks?.beforeMount?.(makeHookCtx(app));
    // Sandbox was kept alive — popstate proxy will now pass events through
    // since the sub-app's route is active again.
    if (app.container) {
      app.container.style.display = "block";
    }
    app.status = "MOUNTED";
    pavilionMfeLog("router", "sub-app-restore", { appCode: app.name });
    dispatch("pavilion-mfe:after-restore", { appCode: app.name });
    hooks?.afterRestore?.(makeHookCtx(app));
  }

  async function mountApp(app: RegisteredApp): Promise<void> {
    if (app.status !== "NOT_MOUNTED") return;
    app.status = "MOUNTING";

    // Activate side-effect sandbox before mounting
    const sandbox = new Sandbox(app.name);
    sandbox.activate();
    app.sandbox = sandbox;

    const t0 = performance.now();
    hooks?.beforeMount?.(makeHookCtx(app));
    const lifecycle = app.lifecycle!;
    const container = getContainer(app.name);
    container.style.display = "block";
    const cleanup = await lifecycle.mount({ appCode: app.name, basename: app.basename }, container);
    app.container = container;
    app.cleanup = cleanup ?? null;
    app.status = "MOUNTED";
    const ms = Math.round(performance.now() - t0);
    pavilionMfeLog("router", "sub-app-mount", { appCode: app.name, ms });
    hooks?.afterMount?.(makeHookCtx(app, ms));
  }

  /**
   * Evict the oldest CACHED sub-app when cache is full (LRU).
   * Called before caching a new sub-app.
   */
  function evictLRU(): void {
    const cachedApps = apps.filter(a => a.status === "CACHED");
    if (cachedApps.length < maxCache) return;

    // Find the oldest cached app by cachedAt
    let oldest = cachedApps[0];
    let oldestTime = keepAliveMap.get(oldest.name)?.cachedAt ?? 0;
    for (const a of cachedApps) {
      const t = keepAliveMap.get(a.name)?.cachedAt ?? 0;
      if (t < oldestTime) {
        oldest = a;
        oldestTime = t;
      }
    }

    // Full unmount the evicted app
    pavilionMfeLog("router", "sub-app-evict", { appCode: oldest.name, reason: "LRU" });
    oldest.sandbox?.deactivate();
    oldest.sandbox = null;
    if (oldest.cleanup) {
      oldest.cleanup();
      oldest.cleanup = null;
    }
    const lifecycle = oldest.lifecycle!;
    if (lifecycle.unmount && oldest.container) {
      lifecycle.unmount({ appCode: oldest.name, basename: "" }, oldest.container);
    }
    if (oldest.container) {
      oldest.container.style.display = "none";
    }
    oldest.status = "NOT_MOUNTED";
    const meta = keepAliveMap.get(oldest.name);
    if (meta) meta.cachedAt = 0;
  }

  async function unmountApp(app: RegisteredApp): Promise<void> {
    if (app.status !== "MOUNTED") return;
    app.status = "UNMOUNTING";
    const t0 = performance.now();
    const meta = keepAliveMap.get(app.name);
    const useKeepAlive = meta?.keepAlive ?? false;

    hooks?.beforeUnmount?.(makeHookCtx(app));

    if (useKeepAlive) {
      // Global LRU eviction before caching
      evictLRU();

      // Keep-alive: hide container, retain framework instance + DOM + sandbox.
      // Do NOT deactivate sandbox — the popstate proxy will block events
      // when the sub-app's route is inactive, and pass them through when
      // the user navigates back. Deactivating would remove the popstate
      // listener permanently, breaking the framework router on restore.
      if (app.container) {
        app.container.style.display = "none";
      }
      app.status = "CACHED";
      if (meta) meta.cachedAt = Date.now();
      const ms = Math.round(performance.now() - t0);
      pavilionMfeLog("router", "sub-app-cache", { appCode: app.name, ms });
      dispatch("pavilion-mfe:before-cache", { appCode: app.name });
      hooks?.beforeCache?.(makeHookCtx(app, ms));
      hooks?.afterUnmount?.(makeHookCtx(app, ms));
      return;
    }

    // Full unmount: deactivate sandbox (timers/listeners cleanup)
    app.sandbox?.deactivate();
    app.sandbox = null;

    // Framework-level cleanup FIRST (React's root.unmount / Vue's app.unmount).
    // The framework owns the DOM inside the container — it must detach before
    // we wipe innerHTML, otherwise React's removeChild throws NotFoundError.
    if (app.cleanup) {
      app.cleanup();
      app.cleanup = null;
    }

    const lifecycle = app.lifecycle!;
    if (lifecycle.unmount && app.container) {
      await lifecycle.unmount({ appCode: app.name, basename: "" }, app.container);
    }
    if (app.container) {
      app.container.style.display = "none";
    }
    app.status = "NOT_MOUNTED";
    const ms = Math.round(performance.now() - t0);
    pavilionMfeLog("router", "sub-app-unmount", { appCode: app.name, ms });
    hooks?.afterUnmount?.(makeHookCtx(app, ms));
  }

  /**
   * Manually clear cached sub-apps.
   * @param name - If provided, clears only the specified sub-app; otherwise clears all.
   */
  function clearCache(name?: string): void {
    const cachedApps = apps.filter(a => a.status === "CACHED" && (!name || a.name === name));
    for (const app of cachedApps) {
      app.sandbox?.deactivate();
      app.sandbox = null;
      if (app.cleanup) {
        app.cleanup();
        app.cleanup = null;
      }
      const lifecycle = app.lifecycle!;
      if (lifecycle.unmount && app.container) {
        lifecycle.unmount({ appCode: app.name, basename: "" }, app.container);
      }
      if (app.container) {
        app.container.style.display = "none";
      }
      app.status = "NOT_MOUNTED";
      const meta = keepAliveMap.get(app.name);
      if (meta) meta.cachedAt = 0;
      pavilionMfeLog("router", "sub-app-clear-cache", { appCode: app.name });
    }
  }

  async function reroute(): Promise<void> {
    // Loop until no more state transitions occur.
    // loadApp transitions NOT_LOADED → NOT_MOUNTED, which must be
    // picked up by a subsequent mountApp pass.  A single pass would
    // snapshots appsToMount before loadApp runs, missing the transition
    // and leaving the app stuck in NOT_MOUNTED (never rendered).
    // On client-side navigation this was accidentally masked because
    // navigateTo() fires both pushState and a synthetic popstate,
    // giving two reroute() calls; page refresh only gets one.
    //
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const activeApps = matchActiveApps();
      const appsToUnmount = apps.filter(app => !activeApps.includes(app) && app.status === "MOUNTED");
      const appsToLoad = activeApps.filter(app => app.status === "NOT_LOADED");
      const appsToMount = activeApps.filter(app => app.status === "NOT_MOUNTED");
      const appsToRestore = activeApps.filter(app => app.status === "CACHED");

      if (
        appsToUnmount.length === 0 &&
        appsToLoad.length === 0 &&
        appsToMount.length === 0 &&
        appsToRestore.length === 0
      ) {
        break;
      }

      await Promise.all(appsToUnmount.map(unmountApp));
      await Promise.all(appsToLoad.map(loadApp));
      await Promise.all(appsToMount.map(mountApp));
      await Promise.all(appsToRestore.map(restoreApp));
    }

    // Detect sub-app switch after reroute completes
    const currentCodes = matchActiveApps()
      .map(a => a.name)
      .sort();
    const prevSorted = [...prevActiveAppCodes].sort();
    if (JSON.stringify(currentCodes) !== JSON.stringify(prevSorted)) {
      dispatch("pavilion-mfe:sub-app-switch", { from: prevActiveAppCodes, to: currentCodes });
      prevActiveAppCodes = currentCodes;
    }
  }

  function patchHistory(): void {
    const originalPushState = window.history.pushState.bind(window.history);
    const originalReplaceState = window.history.replaceState.bind(window.history);

    function runReroute(trigger: HookContext["trigger"], url: string): void {
      // Parse path from url for route-guard detail
      let path = url;
      try {
        path = new URL(url, location.origin).pathname;
      } catch {
        /* url is already a path */
      }
      currentTrigger = trigger;
      currentPath = path;
      const activeApps = matchActiveApps();
      const appCode = activeApps.length > 0 ? activeApps[0].name : "";
      dispatch("pavilion-mfe:before-routing", { url, trigger, path, appCode });
      setTimeout(() => {
        reroute().then(() => {
          dispatch("pavilion-mfe:after-routing", { url, trigger, path, appCode });
        });
      }, 0);
    }

    window.history.pushState = function (state, _title, url) {
      const urlBefore = window.location.href;
      const result = originalPushState(state, _title, url);
      const urlAfter = window.location.href;
      if (urlBefore !== urlAfter) {
        runReroute("pushState", urlAfter);
      }
      return result;
    } as typeof window.history.pushState;

    window.history.replaceState = function (state, _title, url) {
      const urlBefore = window.location.href;
      const result = originalReplaceState(state, _title, url);
      const urlAfter = window.location.href;
      if (urlBefore !== urlAfter) {
        runReroute("replaceState", urlAfter);
      }
      return result;
    } as typeof window.history.replaceState;

    window.addEventListener("popstate", () => {
      runReroute("popstate", window.location.href);
    });
  }

  function start(): void {
    pavilionMfeLog("router", "router-start", { subApps: apps.length, maxCache });

    // Mark the global environment so sub-apps can detect main-app mode
    // via isPavilionMfeMainApp() without querying the DOM.
    (globalThis as Record<string, unknown>).__PAVILION_MFE_ENV__ = true;

    // Set up route isolation: sub-app popstate listeners only fire when
    // the sub-app's route is active. This prevents inactive sub-apps from
    // processing navigation events intended for other sub-apps.
    setRouteMatcher((appCode, path) => {
      return apps.some(app => app.name === appCode && app.activeWhen(path));
    });

    patchHistory();
    // Initial route: dispatch events for the first load
    const url = window.location.href;
    const initPath = window.location.pathname;
    currentTrigger = "init";
    currentPath = initPath;
    const initApps = matchActiveApps();
    const initAppCode = initApps.length > 0 ? initApps[0].name : "";
    dispatch("pavilion-mfe:before-routing", { url, trigger: "init", path: initPath, appCode: initAppCode });
    setTimeout(() => {
      reroute().then(() => {
        dispatch("pavilion-mfe:after-routing", { url, trigger: "init", path: initPath, appCode: initAppCode });
      });
    }, 0);
  }

  return {
    register,
    start,
    reroute,
    clearCache,
    getApps: () => apps
  };
}
