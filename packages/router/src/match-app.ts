/**
 * 路径匹配工具。
 * 提取自 chagee 的 app.js，使用基于前缀的路由。
 */

export interface SubAppRouteConfig {
  name: string;
  routes: string[];
}

/**
 * 为一组路由前缀创建路径匹配函数。
 * 通过规范化尾斜杠确保前缀匹配行为一致。
 *
 * 用法：
 *   const match = createPathMatcher(['/demo', '/demo/list'])
 *   match('/demo/list')  // true
 *   match('/react')      // false
 */
export function createPathMatcher(routes: string[]): (path: string) => boolean {
  return (path: string) => routes.some(route => path.replace(/\/?$/, "/").startsWith(route.replace(/\/?$/, "/")));
}

/**
 * 根据前缀将 URL 路径匹配到子应用。
 * 双方都会规范化尾斜杠，以确保匹配行为一致。
 */
export function matchAppByPath(path: string, subApps: SubAppRouteConfig[]): SubAppRouteConfig | null {
  if (!path) return null;

  // 从完整 URL 中提取路径名
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

  // 分发模拟的 popstate 事件，让自定义路由器感知变化
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}
