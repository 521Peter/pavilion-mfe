/**
 * Path matching utility.
 * Extracted from chagee's app.js — prefix-based routing.
 */

export interface SubAppRouteConfig {
  name: string;
  routes: string[];
}

/**
 * Create a path matcher function for a set of route prefixes.
 * Uses trailing-slash normalization for consistent prefix matching.
 *
 * Usage:
 *   const match = createPathMatcher(['/demo', '/demo/list'])
 *   match('/demo/list')  // true
 *   match('/react')      // false
 */
export function createPathMatcher(routes: string[]): (path: string) => boolean {
  return (path: string) => routes.some(route => path.replace(/\/?$/, "/").startsWith(route.replace(/\/?$/, "/")));
}

/**
 * Match a URL path to a sub-app by prefix.
 * Both sides normalize trailing slashes for consistent matching.
 */
export function matchAppByPath(path: string, subApps: SubAppRouteConfig[]): SubAppRouteConfig | null {
  if (!path) return null;

  // Extract pathname from full URLs
  if (/^(https?:\/\/)/.test(path)) {
    path = new URL(path, location.origin).pathname || "";
  }

  for (const app of subApps) {
    if (createPathMatcher(app.routes)(path)) return app;
  }
  return null;
}

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
