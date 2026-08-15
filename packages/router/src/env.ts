/**
 * PavilionMfe environment detection.
 *
 * The main app's PavilionMfe router sets `window.__PAVILION_MFE_ENV__ = true` when
 * `start()` is called — before any sub-app is loaded. Sub-apps
 * can use `isPavilionMfeMainApp()` to detect whether they are running inside
 * the main app (micro-frontend mode) or standalone.
 *
 * @example
 * import { isPavilionMfeMainApp } from '@pavilion-mfe/router'
 *
 * if (isPavilionMfeMainApp()) {
 *   // Running inside the PavilionMfe main app
 * } else {
 *   // Running standalone
 * }
 */

declare global {
  interface Window {
    __PAVILION_MFE_ENV__?: boolean;
  }
}

/**
 * Check if running inside a PavilionMfe main app (micro-frontend environment).
 *
 * The global `window.__PAVILION_MFE_ENV__` is injected by the main app's
 * PavilionMfe router during `start()`, before sub-apps are loaded.
 */
export function isPavilionMfeMainApp(): boolean {
  return typeof window !== "undefined" && !!window.__PAVILION_MFE_ENV__;
}
