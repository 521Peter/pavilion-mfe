/**
 * Side-effect tracker for micro-frontend segments.
 *
 * Uses a module-level stack to support multiple concurrent sandboxes.
 * Globals are patched once; each side-effect is attributed to the
 * sandbox on top of the stack at creation time.
 */

import { pavilionMfeLog } from "./logger.js";

interface TrackedListener {
  target: EventTarget;
  type: string;
  handler: any;
  options?: any;
}

// ─── Module-level: original method references ───
const origSetTimeout = globalThis.setTimeout.bind(globalThis);
const origSetInterval = globalThis.setInterval.bind(globalThis);
const origClearTimeout = globalThis.clearTimeout.bind(globalThis);
const origClearInterval = globalThis.clearInterval.bind(globalThis);
const origAddEventListener = globalThis.addEventListener.bind(globalThis);
const origRemoveEventListener = globalThis.removeEventListener.bind(globalThis);

// ─── Module-level: active sandbox stack ───
const activeStack: Sandbox[] = [];
let globalsPatched = false;

/**
 * Returns the sandbox currently on top of the active stack.
 * Used by the router to attribute popstate listeners to segments.
 */
export function getActiveSandbox(): Sandbox | undefined {
  return activeStack[activeStack.length - 1];
}

// ─── Route isolation: popstate listener proxying ───

/**
 * Route matcher callback — set by the router.
 * Returns true if the given appCode owns the current route.
 */
let routeMatcher: ((appCode: string, path: string) => boolean) | null = null;

/**
 * Maps original handler → proxy handler for popstate listeners.
 * Allows removeEventListener to translate original → proxy.
 */
const popstateProxyMap = new WeakMap<Function, Function>();

/**
 * Set the route matcher used for popstate isolation.
 * Called by createRouter during start().
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
        // For popstate listeners with a route matcher, wrap with a proxy
        // that only fires when the segment owning this listener is active.
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
    // For popstate, translate original handler → proxy if one was created
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
  /** @internal — tracked timeouts created while this sandbox was active */
  _timeouts: Set<number> = new Set();
  /** @internal — tracked intervals */
  _intervals: Set<number> = new Set();
  /** @internal — tracked event listeners */
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

    // Snapshot cleanup stats before clearing
    const timers = this._timeouts.size;
    const intervals = this._intervals.size;
    const listeners = this._listeners.length;
    const globals = this.globalKeys.size;

    // Remove from active stack
    const idx = activeStack.lastIndexOf(this);
    if (idx !== -1) activeStack.splice(idx, 1);

    // Clean up tracked timers
    this._timeouts.forEach(id => origClearTimeout(id));
    this._timeouts.clear();
    this._intervals.forEach(id => origClearInterval(id));
    this._intervals.clear();

    // Clean up tracked listeners (use original to avoid re-entering the patched fn)
    this._listeners.forEach(({ type, handler, options }) => {
      origRemoveEventListener(type, handler, options);
    });
    this._listeners = [];

    // Clean up tracked global keys
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
