/**
 * PavilionMfe 环境检测。
 *
 * 主应用的 PavilionMfe 路由器会在调用 `start()` 时、加载任何子应用前，
 * 设置 `window.__PAVILION_MFE_ENV__ = true`。子应用可使用
 * `isPavilionMfeMainApp()` 检测自身运行于主应用内（微前端模式）还是独立运行。
 *
 * @example
 * import { isPavilionMfeMainApp } from '@pavilion-mfe/router'
 *
 * if (isPavilionMfeMainApp()) {
 *   // 运行在 PavilionMfe 主应用内
 * } else {
 *   // 独立运行
 * }
 */

declare global {
  interface Window {
    __PAVILION_MFE_ENV__?: boolean;
  }
}

/**
 * 检查当前是否运行在 PavilionMfe 主应用内（微前端环境）。
 *
 * 全局变量 `window.__PAVILION_MFE_ENV__` 由主应用的 PavilionMfe 路由器
 * 在 `start()` 期间、子应用加载前注入。
 */
export function isPavilionMfeMainApp(): boolean {
  return typeof window !== "undefined" && !!window.__PAVILION_MFE_ENV__;
}
