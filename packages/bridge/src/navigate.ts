/**
 * 供子应用使用的跨应用导航工具。
 *
 * 子应用不能导入 @pavilion-mfe/router（它会在主应用上下文中修补 history）。
 * 此函数复用相同的 pushState + popstate 分发逻辑，使 Pavilion 路由器能检测
 * 路由变化并切换应用。
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

  // 分发模拟的 popstate 事件，让自定义路由器感知变化
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}
