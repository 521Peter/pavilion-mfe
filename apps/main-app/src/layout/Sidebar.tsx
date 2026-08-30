import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { useTabs } from "@pavilion-mfe/tabs/react";
import { navigateTo } from "@pavilion-mfe/router";
import { useMenus, type MenuItem } from "../api/menu";
import { useProfile } from "../hooks/useProfile";
import { Icon } from "../components/Icon";
import { isMainAppRoutePath, routeMeta } from "../router";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

/** 折叠后悬浮弹出的子菜单（替代 el-menu--popup） */
interface PopupState {
  menu: MenuItem;
  top: number;
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const allMenus = useMenus();
  const profileResource = useProfile();
  const isAdmin = profileResource.status === "ready" && profileResource.profile.roles.includes("ADMIN");
  const menuList = useMemo(
    () =>
      isAdmin
        ? allMenus
        : allMenus.map(menu => ({
            ...menu,
            childrenMenuInfoList: menu.childrenMenuInfoList?.filter(child => child.menuUrl !== "/usage")
          })),
    [allMenus, isAdmin]
  );
  const { openTab } = useTabs();

  const [isCollapse, setIsCollapse] = useState(false);
  /** 当前路径（响应式，监听子应用内部导航） */
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  /** 展开的子菜单 key（有子菜单的一级菜单） */
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [popup, setPopup] = useState<PopupState | null>(null);

  // 监听 React Router 路由变化（主应用导航）
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location.pathname]);

  // pavilion 路由事件：子应用通过 pushState 导航时触发；popstate：浏览器前进/后退
  useEffect(() => {
    const sync = () => setCurrentPath(window.location.pathname);
    window.addEventListener("pavilion-mfe:after-routing", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("pavilion-mfe:after-routing", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  // 菜单加载完成 / 路径变化后，自动展开当前路径所在的子菜单
  useEffect(() => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      for (const menu of menuList) {
        if (menu.childrenMenuInfoList?.some(c => c.menuUrl === currentPath)) {
          next.add(menu.menuCode);
        }
      }
      return next;
    });
  }, [menuList, currentPath]);

  function toggleExpand(menuCode: string) {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(menuCode)) {
        next.delete(menuCode);
      } else {
        next.add(menuCode);
      }
      return next;
    });
  }

  function openPopup(e: React.MouseEvent, menu: MenuItem) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({ menu, top: rect.top });
  }

  /** el-menu 选中回调 */
  function handleSelect(index: string) {
    let title = index;
    const metaTitle = routeMeta[index];
    if (metaTitle) {
      title = metaTitle;
    } else {
      for (const menu of menuList) {
        for (const child of menu.childrenMenuInfoList ?? []) {
          if (child.menuUrl === index) {
            title = child.menuName;
            break;
          }
        }
        if (menu.menuUrl === index) {
          title = menu.menuName;
          break;
        }
      }
    }

    if (!["/403", "/404", "/500"].includes(index)) {
      openTab({ path: index, title });
    }

    if (isMainAppRoutePath(index)) {
      navigate(index);
    } else {
      navigateTo(index);
    }
  }

  return (
    <aside className="bg-sidebar-bg flex flex-col overflow-hidden relative transition-[width] duration-300 ease">
      {/* 标志 */}
      <div
        className={cn(
          "flex items-center cursor-pointer select-none min-h-[60px] border-b border-white/[0.08] transition-[padding] duration-300",
          isCollapse ? "px-4" : "px-[22px]"
        )}
        onClick={() => navigate("/")}
      >
        <Logo />
        <span
          className={cn(
            "text-white text-[17px] font-bold tracking-[0.5px] whitespace-nowrap overflow-hidden min-w-0 max-w-[150px] ml-2.5 opacity-100 transition-[max-width,opacity,margin] duration-300",
            isCollapse && "max-w-0 opacity-0 ml-0"
          )}
        >
          PavilionMfe
        </span>
      </div>

      {/* 菜单 */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {menuList.map(menu =>
          menu.childrenMenuInfoList?.length ? (
            <div
              key={menu.menuCode}
              onMouseEnter={e => isCollapse && openPopup(e, menu)}
              onMouseLeave={() => isCollapse && setPopup(null)}
            >
              <div
                className={cn(
                  "relative flex items-center gap-2.5 h-14 text-sm text-white/60 cursor-pointer transition-colors duration-200",
                  isCollapse ? "justify-center px-0" : "px-5 hover:bg-white/[0.07]"
                )}
                onClick={() => !isCollapse && toggleExpand(menu.menuCode)}
              >
                <Icon name={menu.menuIcon} size={16} className="shrink-0" />
                {!isCollapse && (
                  <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                    {menu.menuName}
                  </span>
                )}
                {!isCollapse && (
                  <span
                    className={cn(
                      "w-2 h-2 border-r-[1.5px] border-b-[1.5px] border-current rotate-45 transition-transform duration-200 shrink-0",
                      expandedKeys.has(menu.menuCode) && "-rotate-[135deg]"
                    )}
                  />
                )}
              </div>
              {!isCollapse && expandedKeys.has(menu.menuCode) && (
                <div className="bg-black/[0.15]">
                  {menu.childrenMenuInfoList.map(child => {
                    const isActive = currentPath === child.menuUrl;
                    return (
                      <div
                        key={child.menuUrl}
                        className={cn(
                          "relative flex items-center gap-2.5 h-14 pl-10 pr-5 text-sm cursor-pointer transition-colors duration-200 menu-accent",
                          isActive
                            ? "bg-[rgba(99,91,255,0.15)] text-white menu-accent-active"
                            : "text-white/60 hover:bg-white/[0.07]"
                        )}
                        onClick={() => handleSelect(child.menuUrl)}
                      >
                        <Icon name={child.menuIcon} size={16} className="shrink-0" />
                        <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                          {child.menuName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            (() => {
              const isActive = currentPath === menu.menuUrl;
              return (
                <div
                  key={menu.menuUrl}
                  className={cn(
                    "relative flex items-center gap-2.5 h-14 text-sm cursor-pointer transition-colors duration-200 menu-accent",
                    isCollapse ? "justify-center px-0" : "px-5",
                    isActive
                      ? "bg-[rgba(99,91,255,0.15)] text-white menu-accent-active"
                      : "text-white/60 hover:bg-white/[0.07]"
                  )}
                  onClick={() => handleSelect(menu.menuUrl)}
                >
                  <Icon name={menu.menuIcon} size={16} className="shrink-0" />
                  {!isCollapse && (
                    <span className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                      {menu.menuName}
                    </span>
                  )}
                </div>
              );
            })()
          )
        )}
      </nav>

      {/* 底部：用户信息 + 折叠按钮 */}
      <div
        className={cn(
          "flex items-center justify-between py-3 border-t border-white/[0.08] transition-[padding,justify-content] duration-300",
          isCollapse ? "justify-center px-0" : "pl-6 pr-4"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 overflow-hidden max-w-[160px] opacity-100 transition-[max-width,opacity] duration-300",
            isCollapse && "max-w-0 opacity-0"
          )}
        >
          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shrink-0">
            PA
          </div>
          <div className="overflow-hidden whitespace-nowrap">
            <div className="text-white text-[13px] font-medium leading-[1.4]">Admin</div>
            <div className="text-white/40 text-[11px] leading-[1.4]">管理员</div>
          </div>
        </div>
        <div
          className="flex justify-center items-center w-8 h-8 rounded-sm text-white/40 transition-colors shrink-0 hover:text-white/80 hover:bg-white/[0.08]"
          onClick={() => setIsCollapse(c => !c)}
        >
          <Icon name={isCollapse ? "ChevronDown" : "ChevronUp"} size={18} className="animate-icon-swap" />
        </div>
      </div>

      {/* 折叠后悬浮的子菜单 */}
      {popup &&
        isCollapse &&
        createPortal(
          <div
            className="fixed z-[9999] min-w-[180px] bg-sidebar-bg rounded-md shadow-lg py-1"
            style={{ top: popup.top, left: 64 }}
          >
            <div className="flex items-center gap-2 py-2.5 px-4 text-[13px] text-white/50">
              <Icon name={popup.menu.menuIcon} size={14} />
              <span>{popup.menu.menuName}</span>
            </div>
            {popup.menu.childrenMenuInfoList?.map(child => {
              const isActive = currentPath === child.menuUrl;
              return (
                <div
                  key={child.menuUrl}
                  className={cn(
                    "flex items-center gap-2 py-2.5 px-4 text-[13px] cursor-pointer transition-colors",
                    isActive ? "bg-primary-active text-white" : "text-white/60 hover:bg-white/[0.07]"
                  )}
                  onClick={() => {
                    handleSelect(child.menuUrl);
                    setPopup(null);
                  }}
                >
                  <Icon name={child.menuIcon} size={14} />
                  <span>{child.menuName}</span>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </aside>
  );
}
