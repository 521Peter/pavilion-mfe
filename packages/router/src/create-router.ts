import type { SubApp, RegisteredApp, RouterConfig, RouterHooks, HookContext } from "./types.js";
import { Sandbox, setRouteMatcher, pavilionMfeLog } from "@pavilion-mfe/sandbox";

/**
 * 微前端生命周期路由器。
 * 提取自 chagee 的 routerManager.js。
 *
 * 根据 URL 路径匹配管理多个子应用的
 * 加载 → bootstrap → mount → unmount 生命周期。
 * 挂载时启用沙箱隔离，卸载时清理。
 */
export function createRouter(config?: RouterConfig) {
  const apps: RegisteredApp[] = [];
  let prevActiveAppCodes: string[] = [];
  const maxCache = config?.maxCache ?? 5;
  const hooks: RouterHooks | undefined = config?.hooks;

  // 追踪各应用的 keep-alive 配置和缓存元数据
  const keepAliveMap = new Map<string, { keepAlive: boolean; cachedAt: number }>();

  /**
   * 分发 PavilionMfe 路由事件。
   * 事件：pavilion-mfe:before-routing、pavilion-mfe:after-routing、pavilion-mfe:sub-app-switch、
   *         pavilion-mfe:before-cache、pavilion-mfe:after-restore、pavilion-mfe:sub-app-error
   */
  function dispatch(name: string, detail: Record<string, unknown>): void {
    pavilionMfeLog("router", name.replace("pavilion-mfe:", ""), detail);
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }

  /** 为当前路由触发动作构建 HookContext */
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
    // 宿主容器必须具备确定高度，子应用才能用 height:100% 链式撑满。
    // 否则子应用顶层 h-full 相对 auto 父级会塌缩成内容高度，导致布局错乱。
    div.style.height = "100%";
    div.style.width = "100%";
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
   * 恢复 CACHED 应用：重新显示容器并激活沙箱。
   * 框架实例仍然存活，因此跳过 mount()。
   */
  async function restoreApp(app: RegisteredApp): Promise<void> {
    if (app.status !== "CACHED") return;
    hooks?.beforeMount?.(makeHookCtx(app));
    // 沙箱仍然存活；子应用路由重新激活后，popstate 代理会再次放行事件
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

    // 挂载前激活副作用沙箱
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
   * 缓存已满时淘汰最旧的 CACHED 子应用（LRU）。
   * 在缓存新子应用前调用。
   */
  function evictLRU(): void {
    const cachedApps = apps.filter(a => a.status === "CACHED");
    if (cachedApps.length < maxCache) return;

    // 根据 cachedAt 查找最旧的缓存应用
    let oldest = cachedApps[0];
    let oldestTime = keepAliveMap.get(oldest.name)?.cachedAt ?? 0;
    for (const a of cachedApps) {
      const t = keepAliveMap.get(a.name)?.cachedAt ?? 0;
      if (t < oldestTime) {
        oldest = a;
        oldestTime = t;
      }
    }

    // 完整卸载被淘汰的应用
    pavilionMfeLog("router", "sub-app-evict", { appCode: oldest.name, reason: "LRU" });
    oldest.sandbox?.deactivate();
    oldest.sandbox = null;
    if (oldest.cleanup) {
      oldest.cleanup();
      oldest.cleanup = null;
    }
    const lifecycle = oldest.lifecycle!;
    if (lifecycle.unmount && oldest.container) {
      void lifecycle.unmount({ appCode: oldest.name, basename: "" }, oldest.container);
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
      // 缓存前执行全局 LRU 淘汰
      evictLRU();

      // Keep-alive：隐藏容器，保留框架实例、DOM 和沙箱。
      // 不要停用沙箱；子应用路由未激活时 popstate 代理会拦截事件，
      // 用户返回后则重新放行。停用沙箱会永久移除 popstate 监听器，
      // 导致恢复时框架路由器失效。
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

    // 完整卸载：停用沙箱（清理定时器和监听器）
    app.sandbox?.deactivate();
    app.sandbox = null;

    // 首先执行框架级清理（React 的 root.unmount / Vue 的 app.unmount）。
    // 容器内的 DOM 归框架管理，必须先由框架解除挂载再清空 innerHTML，
    // 否则 React 的 removeChild 会抛出 NotFoundError。
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
   * 手动清除已缓存的子应用。
   * @param name - 提供时仅清除指定子应用，否则清除全部。
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
        void lifecycle.unmount({ appCode: app.name, basename: "" }, app.container);
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
    // 持续循环，直到不再发生状态转换。
    // loadApp 会将 NOT_LOADED 转为 NOT_MOUNTED，后续必须再执行一轮 mountApp 才能处理。
    // 若只执行一轮，会在 loadApp 运行前生成 appsToMount 快照，从而遗漏状态转换，
    // 使应用停留在 NOT_MOUNTED（永不渲染）。客户端导航时这一问题曾被意外掩盖，
    // 因为 navigateTo() 会同时触发 pushState 和模拟的 popstate，产生两次 reroute()；
    // 而页面刷新只会触发一次。
    //
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

    // reroute 完成后检测子应用切换
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
      // 从 URL 解析路径，写入路由守卫详情
      let path = url;
      try {
        path = new URL(url, location.origin).pathname;
      } catch {
        /* URL 已经是路径 */
      }
      currentTrigger = trigger;
      currentPath = path;
      const activeApps = matchActiveApps();
      const appCode = activeApps.length > 0 ? activeApps[0].name : "";
      dispatch("pavilion-mfe:before-routing", { url, trigger, path, appCode });
      setTimeout(() => {
        void reroute().then(() => dispatch("pavilion-mfe:after-routing", { url, trigger, path, appCode }));
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

    // 标记全局环境，使子应用无需查询 DOM 即可通过
    // isPavilionMfeMainApp() 检测主应用模式。
    (globalThis as Record<string, unknown>).__PAVILION_MFE_ENV__ = true;

    // 设置路由隔离：仅当子应用路由激活时才触发其 popstate 监听器，
    // 防止未激活的子应用处理发往其他子应用的导航事件。
    setRouteMatcher((appCode, path) => {
      return apps.some(app => app.name === appCode && app.activeWhen(path));
    });

    patchHistory();
    // 初始路由：为首次加载分发事件
    const url = window.location.href;
    const initPath = window.location.pathname;
    currentTrigger = "init";
    currentPath = initPath;
    const initApps = matchActiveApps();
    const initAppCode = initApps.length > 0 ? initApps[0].name : "";
    dispatch("pavilion-mfe:before-routing", { url, trigger: "init", path: initPath, appCode: initAppCode });
    setTimeout(() => {
      void reroute().then(() =>
        dispatch("pavilion-mfe:after-routing", { url, trigger: "init", path: initPath, appCode: initAppCode })
      );
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
