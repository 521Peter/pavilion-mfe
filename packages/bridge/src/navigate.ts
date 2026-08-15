/**
 * Cross-app navigation utility for sub-apps.
 *
 * Sub-apps cannot import @pavilion-mfe/router (it patches history
 * in the main-app context). This function replicates the same
 * pushState + popstate dispatch so the pavilion router detects
 * the route change and switches apps.
 */
export function navigateTo(url: string, options: { replace?: boolean; open?: boolean } = {}): void {
  if (options.open) {
    window.open(url);
    return;
  }

  if (options.replace) {
    window.history.replaceState(null, "", url);
  } else {
    window.history.pushState(null, "", url);
  }

  // Dispatch synthetic popstate so custom routers pick up the change
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}
