/**
 * 微前端模块的副作用追踪器。
 *
 * 使用模块级栈支持多个并发沙箱。全局对象只修补一次；
 * 每个副作用都归属于创建时位于栈顶的沙箱。
 */

import { pavilionMfeLog } from "./logger.js";

interface TrackedListener {
  target: EventTarget;
  type: string;
  handler: any;
  options?: any;
}

// ─── 模块级：原始方法引用 ───
const origSetTimeout = globalThis.setTimeout.bind(globalThis);
const origSetInterval = globalThis.setInterval.bind(globalThis);
const origClearTimeout = globalThis.clearTimeout.bind(globalThis);
const origClearInterval = globalThis.clearInterval.bind(globalThis);
const origAddEventListener = globalThis.addEventListener.bind(globalThis);
const origRemoveEventListener = globalThis.removeEventListener.bind(globalThis);

// ─── 模块级：活动沙箱栈 ───
const activeStack: Sandbox[] = [];
let globalsPatched = false;

/**
 * 返回当前位于活动栈顶的沙箱。
 * 路由器用它确定 popstate 监听器所属的模块。
 */
export function getActiveSandbox(): Sandbox | undefined {
  return activeStack[activeStack.length - 1];
}

// ─── 路由隔离：代理 popstate 监听器 ───

/**
 * 由路由器设置的路由匹配回调。
 * 指定 appCode 拥有当前路由时返回 true。
 */
let routeMatcher: ((appCode: string, path: string) => boolean) | null = null;

/**
 * 将 popstate 监听器的原始处理函数映射到代理处理函数，
 * 使 removeEventListener 能将原始函数转换为代理函数。
 */
const popstateProxyMap = new WeakMap<Function, Function>();

/**
 * 设置 popstate 隔离使用的路由匹配器。
 * 由 createRouter 在 start() 期间调用。
 */
export function setRouteMatcher(fn: (appCode: string, path: string) => boolean): void {
  routeMatcher = fn;
}

function patchGlobals(): void {
  if (globalsPatched) return;
  globalsPatched = true;
  pavilionMfeLog("sandbox", "globals-patch");

  globalThis.setTimeout = ((handler: any, timeout?: any, ...args: any[]) => {
    const id = origSetTimeout(handler, timeout, ...args) as number;
    const active = activeStack[activeStack.length - 1];
    if (active) active._timeouts.add(id);
    return id;
  }) as any;

  globalThis.setInterval = ((handler: any, timeout?: any, ...args: any[]) => {
    const id = origSetInterval(handler, timeout, ...args) as number;
    const active = activeStack[activeStack.length - 1];
    if (active) active._intervals.add(id);
    return id;
  }) as any;

  globalThis.clearTimeout = ((id: any) => {
    for (const s of activeStack) s._timeouts.delete(id);
    origClearTimeout(id);
  }) as any;

  globalThis.clearInterval = ((id: any) => {
    for (const s of activeStack) s._intervals.delete(id);
    origClearInterval(id);
  }) as any;

  globalThis.addEventListener = ((type: any, handler: any, options?: any) => {
    if (handler) {
      const active = activeStack[activeStack.length - 1];
      if (active) {
        // 对具备路由匹配器的 popstate 监听器添加代理，
        // 仅在拥有该监听器的模块处于活动状态时触发
        if (type === "popstate" && routeMatcher) {
          const appCode = active.appCode;
          const proxyHandler = (event: Event) => {
            if (routeMatcher!(appCode, location.pathname)) {
              handler(event);
            } else {
              pavilionMfeLog("sandbox", "popstate-blocked", { appCode, path: location.pathname });
            }
          };
          popstateProxyMap.set(handler, proxyHandler);
          active._listeners.push({ target: globalThis, type, handler: proxyHandler, options });
          origAddEventListener(type, proxyHandler, options);
          return;
        }
        active._listeners.push({ target: globalThis, type, handler, options });
      }
    }
    origAddEventListener(type, handler, options);
  }) as any;

  globalThis.removeEventListener = ((type: any, handler: any, options?: any) => {
    // 对 popstate，将原始处理函数转换为已创建的代理函数
    let effectiveHandler = handler;
    if (type === "popstate") {
      const proxy = popstateProxyMap.get(handler);
      if (proxy) {
        popstateProxyMap.delete(handler);
        effectiveHandler = proxy;
      }
    }
    for (const s of activeStack) {
      s._listeners = s._listeners.filter(l => !(l.type === type && l.handler === effectiveHandler));
    }
    origRemoveEventListener(type, effectiveHandler, options);
  }) as any;
}

export class Sandbox {
  /** @internal — 此沙箱活动期间创建并追踪的 timeout */
  _timeouts: Set<number> = new Set();
  /** @internal — 已追踪的 interval */
  _intervals: Set<number> = new Set();
  /** @internal — 已追踪的事件监听器 */
  _listeners: TrackedListener[] = [];

  private globalKeys: Set<string> = new Set();
  private activated = false;

  constructor(public appCode: string) {}

  activate(): void {
    if (this.activated) return;
    patchGlobals();
    activeStack.push(this);
    this.activated = true;
    pavilionMfeLog("sandbox", "sandbox-activate", { appCode: this.appCode });
  }

  deactivate(): void {
    if (!this.activated) return;
    this.activated = false;

    // 清理前记录统计快照
    const timers = this._timeouts.size;
    const intervals = this._intervals.size;
    const listeners = this._listeners.length;
    const globals = this.globalKeys.size;

    // 从活动栈中移除
    const idx = activeStack.lastIndexOf(this);
    if (idx !== -1) activeStack.splice(idx, 1);

    // 清理已追踪的定时器
    this._timeouts.forEach(id => origClearTimeout(id));
    this._timeouts.clear();
    this._intervals.forEach(id => origClearInterval(id));
    this._intervals.clear();

    // 清理已追踪的监听器（使用原始方法，避免再次进入已修补函数）
    this._listeners.forEach(({ type, handler, options }) => {
      origRemoveEventListener(type, handler, options);
    });
    this._listeners = [];

    // 清理已追踪的全局键
    this.globalKeys.forEach(key => {
      delete (globalThis as any)[key];
    });
    this.globalKeys.clear();

    pavilionMfeLog("sandbox", "sandbox-deactivate", {
      appCode: this.appCode,
      timers,
      intervals,
      listeners,
      globals
    });
  }

  trackGlobal(key: string): void {
    this.globalKeys.add(key);
  }
}
