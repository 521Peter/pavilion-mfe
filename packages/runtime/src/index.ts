/**
 * @pavilion-mfe/runtime — Shared runtime kernel
 *
 * This package is designed to be exposed as a Module Federation remote.
 * Main app and sub-apps both import from it and share the same instance.
 *
 * It re-exports everything from the lower-level PavilionMfe packages
 * and adds orchestrator-level utilities.
 */

export { createRouter, matchAppByPath, navigateTo } from "@pavilion-mfe/router";

export type { SubApp, SubAppLifecycle, AppContext, SubAppRouteConfig } from "@pavilion-mfe/router";

export { EventBus, StorageSync, MFEEvent } from "@pavilion-mfe/bridge";

export type { RouteChangeDetail, SwitchAppDetail, EventCallback } from "@pavilion-mfe/bridge";

export { Sandbox } from "@pavilion-mfe/sandbox";
