import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTabs } from '@pavilion-mfe/tabs/react'
import { navigateTo } from '@pavilion-mfe/router'
import { useMenus, type MenuItem } from '../api/menu'
import { Icon } from '../components/Icon'
import { deployBasePath, normalizePath } from '../utils/path'
import { isMainAppRoutePath, routeMeta } from '../router'
import Logo from './Logo'
import styles from './Sidebar.module.css'

/** 折叠后悬浮弹出的子菜单（替代 el-menu--popup） */
interface PopupState {
  menu: MenuItem
  top: number
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const menuList = useMenus()
  const { openTab } = useTabs()

  const [isCollapse, setIsCollapse] = useState(false)
  /** 当前路径（响应式，监听子应用内部导航） */
  const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname))
  /** 展开的子菜单 key（有子菜单的一级菜单） */
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [popup, setPopup] = useState<PopupState | null>(null)

  // 监听 React Router 路由变化（主应用导航）
  useEffect(() => {
    setCurrentPath(normalizePath(location.pathname))
  }, [location.pathname])

  // pavilion 路由事件：子应用通过 pushState 导航时触发；popstate：浏览器前进/后退
  useEffect(() => {
    const sync = () => setCurrentPath(normalizePath(window.location.pathname))
    window.addEventListener('pavilion-mfe:after-routing', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('pavilion-mfe:after-routing', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  // 菜单加载完成 / 路径变化后，自动展开当前路径所在的子菜单
  useEffect(() => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      for (const menu of menuList) {
        if (menu.childrenMenuInfoList?.some((c) => c.menuUrl === currentPath)) {
          next.add(menu.menuCode)
        }
      }
      return next
    })
  }, [menuList, currentPath])

  function toggleExpand(menuCode: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(menuCode)) {
        next.delete(menuCode)
      } else {
        next.add(menuCode)
      }
      return next
    })
  }

  function openPopup(e: React.MouseEvent, menu: MenuItem) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopup({ menu, top: rect.top })
  }

  /** el-menu 选中回调 */
  function handleSelect(index: string) {
    // 查找菜单标题：路由 meta → 后端菜单 → 降级路径
    let title = index
    const metaTitle = routeMeta[index]
    if (metaTitle) {
      title = metaTitle
    } else {
      for (const menu of menuList) {
        for (const child of menu.childrenMenuInfoList ?? []) {
          if (child.menuUrl === index) {
            title = child.menuName
            break
          }
        }
        if (menu.menuUrl === index) {
          title = menu.menuName
          break
        }
      }
    }

    // 错误页面不创建 Tab
    if (!['/403', '/404', '/500'].includes(index)) {
      openTab({ path: index, title })
    }

    if (isMainAppRoutePath(index)) {
      navigate(index)
    } else {
      // 子应用路由：navigateTo 使用 window.history.pushState，需手动加上部署前缀
      navigateTo(deployBasePath + index)
    }
  }

  const sidebarClass = `${styles.sidebar}${isCollapse ? ` ${styles.collapsed}` : ''}`

  return (
    <aside className={sidebarClass}>
      {/* Logo */}
      <div
        className={`${styles.logo}${isCollapse ? ` ${styles.logoCollapsed}` : ''}`}
        onClick={() => navigate('/')}
      >
        <Logo />
        <span className={styles.logoText}>PavilionMfe</span>
      </div>

      {/* 菜单（全部从接口数据动态渲染） */}
      <nav className={styles.menu}>
        {menuList.map((menu) =>
          menu.childrenMenuInfoList?.length ? (
            <div
              key={menu.menuCode}
              className={styles.subMenuWrap}
              onMouseEnter={(e) => isCollapse && openPopup(e, menu)}
              onMouseLeave={() => isCollapse && setPopup(null)}
            >
              <div
                className={styles.subMenuTitle}
                onClick={() => !isCollapse && toggleExpand(menu.menuCode)}
              >
                <Icon name={menu.menuIcon} size={16} className={styles.menuIcon} />
                {!isCollapse && <span className={styles.menuText}>{menu.menuName}</span>}
                {!isCollapse && (
                  <span
                    className={`${styles.arrow}${
                      expandedKeys.has(menu.menuCode) ? ` ${styles.arrowOpen}` : ''
                    }`}
                  />
                )}
              </div>
              {!isCollapse && expandedKeys.has(menu.menuCode) && (
                <div className={styles.subMenuItems}>
                  {menu.childrenMenuInfoList.map((child) => (
                    <div
                      key={child.menuUrl}
                      className={`${styles.menuItem}${
                        currentPath === child.menuUrl ? ` ${styles.menuItemActive}` : ''
                      }`}
                      onClick={() => handleSelect(child.menuUrl)}
                    >
                      <Icon name={child.menuIcon} size={16} className={styles.menuIcon} />
                      <span className={styles.menuText}>{child.menuName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              key={menu.menuUrl}
              className={`${styles.menuItem}${
                currentPath === menu.menuUrl ? ` ${styles.menuItemActive}` : ''
              }`}
              onClick={() => handleSelect(menu.menuUrl)}
            >
              <Icon name={menu.menuIcon} size={16} className={styles.menuIcon} />
              {!isCollapse && <span className={styles.menuText}>{menu.menuName}</span>}
            </div>
          ),
        )}
      </nav>

      {/* 底部：用户信息 + 折叠按钮 */}
      <div className={`${styles.sidebarFooter}${isCollapse ? ` ${styles.footerCollapsed}` : ''}`}>
        <div className={styles.userInfoLeft}>
          <div className={styles.userAvatar}>PA</div>
          <div className={styles.userDetail}>
            <div className={styles.userName}>Admin</div>
            <div className={styles.userRole}>管理员</div>
          </div>
        </div>
        <div className={styles.collapseBtn} onClick={() => setIsCollapse((c) => !c)}>
          <Icon name={isCollapse ? 'Expand' : 'Fold'} size={18} className={styles.collapseIcon} />
        </div>
      </div>

      {/* 折叠后悬浮的子菜单（固定定位，挂到 body 下避免被 overflow 裁剪） */}
      {popup &&
        isCollapse &&
        createPortal(
          <div className={styles.menuPopup} style={{ top: popup.top, left: 64 }}>
            <div className={styles.popupTitle}>
              <Icon name={popup.menu.menuIcon} size={14} />
              <span>{popup.menu.menuName}</span>
            </div>
            {popup.menu.childrenMenuInfoList?.map((child) => (
              <div
                key={child.menuUrl}
                className={`${styles.popupItem}${
                  currentPath === child.menuUrl ? ` ${styles.popupItemActive}` : ''
                }`}
                onClick={() => {
                  handleSelect(child.menuUrl)
                  setPopup(null)
                }}
              >
                <Icon name={child.menuIcon} size={14} />
                <span>{child.menuName}</span>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </aside>
  )
}
