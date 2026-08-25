import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTabs } from "@pavilion-mfe/tabs/react";
import { routeMeta } from "../router";
import { useMenus } from "../api/menu";
import { isSubAppPath, normalizePath } from "../utils/path";
import Sidebar from "./Sidebar";
import TabBar from "./TabBar";
import { Skeleton } from "@heroui/react";
import { cn } from "@/lib/utils";

export default function MainLayout() {
  const location = useLocation();
  const { tabs, openTab } = useTabs();
  const menus = useMenus();

  // 用 ref 持有最新 tabs / menus，避免事件监听闭包读到过期数据
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);
  const menusRef = useRef(menus);
  useEffect(() => {
    menusRef.current = menus;
  }, [menus]);

  /** 当前路由是否属于微前端子应用 */
  const isSubAppRoute = isSubAppPath(normalizePath(location.pathname));

  /** 子应用加载状态 */
  const [isSubAppLoading, setIsSubAppLoading] = useState(false);

  // 进入子应用路由时显示 loading，子应用挂载完成后隐藏
  useEffect(() => {
    if (isSubAppRoute) setIsSubAppLoading(true);
  }, [isSubAppRoute]);

  /** 查找菜单标题：路由 meta → 后端菜单 → 降级路径 */
  function findMenuTitle(path: string): string {
    const metaTitle = routeMeta[path];
    if (metaTitle) return metaTitle;
    for (const menu of menusRef.current) {
      for (const child of menu.childrenMenuInfoList ?? []) {
        if (child.menuUrl === path) return child.menuName;
      }
      if (menu.menuUrl === path) return menu.menuName;
    }
    return path;
  }

  /** 路由 → Tab 单向同步 */
  function syncRouteToTabs(fullUrl: string) {
    // 分离路径和查询参数，用路径去重
    const url = new URL(fullUrl, window.location.origin);
    // 去掉部署前缀，统一为应用内路径，确保与菜单 URL 匹配
    const path = normalizePath(url.pathname);
    const search = url.search;

    if (path === "/403" || path === "/404" || path === "/500") return;

    const exists = tabsRef.current.find(t => t.path === path);
    if (exists) {
      openTab({ path, fullPath: path + search, title: exists.title });
    } else {
      openTab({ path, fullPath: path + search, title: findMenuTitle(path) });
    }
  }

  // 监听 React Router 路由变化，同步 Tab
  useEffect(() => {
    syncRouteToTabs(location.pathname + location.search);
    // 依赖仅在路径变化时触发；syncRouteToTabs 通过 ref 读取最新状态
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  // 菜单加载完成后，刷新已有 Tab 的标题
  useEffect(() => {
    if (menus.length === 0) return;
    for (const tab of tabsRef.current) {
      const title = findMenuTitle(tab.path);
      if (title !== tab.title) {
        openTab({ ...tab, title });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus]);

  // 监听子应用内部导航（pushState / popstate），同步 Tab 并隐藏 loading
  useEffect(() => {
    function onUrlChange() {
      syncRouteToTabs(window.location.pathname + window.location.search);
      setIsSubAppLoading(false);
    }
    window.addEventListener("popstate", onUrlChange);
    window.addEventListener("pavilion-mfe:after-routing", onUrlChange);
    return () => {
      window.removeEventListener("popstate", onUrlChange);
      window.removeEventListener("pavilion-mfe:after-routing", onUrlChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-background overflow-hidden flex flex-col">
        <TabBar />
        <div className={cn("flex-1 overflow-auto", isSubAppRoute ? "p-0" : "py-7 px-8")}>
          {/* 主应用页面（v-show 语义：子应用路由时隐藏但保持 DOM 存活） */}
          <div style={{ display: isSubAppRoute ? "none" : undefined }}>
            <Outlet />
          </div>
          {/* 子应用容器（始终在 DOM 中，保证 keep-alive 缓存不被销毁） */}
          <div className="relative h-full min-h-[400px]" style={{ display: isSubAppRoute ? undefined : "none" }}>
            {isSubAppLoading && (
              <div className="absolute inset-0 z-10 py-7 px-8 bg-card-bg animate-fade-in">
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full rounded" />
                  ))}
                </div>
              </div>
            )}
            <div id="pavilion-mfe-container"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
