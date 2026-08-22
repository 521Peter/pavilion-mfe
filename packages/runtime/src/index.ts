/**
 * @pavilion-mfe/runtime — 共享运行时内核
 *
 * 此包设计为通过 Module Federation 远程模块暴露。
 * 主应用和子应用都从中导入并共享同一实例。
 *
 * 它重新导出底层 PavilionMfe 包的全部内容，并添加编排层工具。
 */

export { createRouter, matchAppByPath, navigateTo } from "@pavilion-mfe/router";

export type { SubApp, SubAppLifecycle, AppContext, SubAppRouteConfig } from "@pavilion-mfe/router";

export { EventBus, StorageSync, MFEEvent } from "@pavilion-mfe/bridge";

export type { RouteChangeDetail, SwitchAppDetail, EventCallback } from "@pavilion-mfe/bridge";

export { Sandbox } from "@pavilion-mfe/sandbox";
