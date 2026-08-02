import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTabs, type TabsAPI } from '@pavilion-mfe/tabs/react'
import { navigateTo } from '@pavilion-mfe/router'
import { deployBasePath, isSubAppPath } from '../utils/path'
import styles from './TabBar.module.css'

type Tab = TabsAPI['tabs'][number]

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  tabId: string
}

export default function TabBar() {
  const navigate = useNavigate()
  const { tabs, activeTabId, closeTab, closeOthers, closeAll } = useTabs()

  const tabBarRef = useRef<HTMLDivElement | null>(null)
  const tabListRef = useRef<HTMLDivElement | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    tabId: '',
  })

  /** 将滚动位置限制在可视范围内 */
  function clampScroll(value: number): number {
    const el = tabListRef.current
    if (!el) return value
    const containerWidth = el.parentElement!.clientWidth
    const scrollWidth = el.scrollWidth
    const maxScroll = Math.min(0, containerWidth - scrollWidth)
    return Math.max(maxScroll, Math.min(0, value))
  }

  // 水平滚动：原生非 passive 监听，阻止页面随鼠标滚轮滚动
  useEffect(() => {
    const el = tabBarRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY || e.deltaX
      setScrollLeft((prev) => clampScroll(prev - delta))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // 切换 Tab 时自动滚动到可见区域
  useEffect(() => {
    const el = tabListRef.current
    if (!el) return
    const activeEl = el.querySelector(
      `.${styles.tabItem}.${styles.tabItemActive}`,
    ) as HTMLElement | null
    if (!activeEl) return
    const listRect = el.getBoundingClientRect()
    const tabRect = activeEl.getBoundingClientRect()
    if (tabRect.left < listRect.left) {
      setScrollLeft((prev) => clampScroll(prev - (tabRect.left - listRect.left)))
    } else if (tabRect.right > listRect.right) {
      setScrollLeft((prev) => clampScroll(prev - (tabRect.right - listRect.right)))
    }
  }, [activeTabId, tabs])

  function onContextMenu(e: React.MouseEvent, tab: Tab) {
    const menuWidth = 130
    const menuHeight = 72
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - menuWidth),
      y: Math.min(e.clientY, window.innerHeight - menuHeight),
      tabId: tab.id,
    })
  }

  function handleTabClick(tab: Tab) {
    setContextMenu((prev) => ({ ...prev, visible: false }))
    if (tab.id === activeTabId) return
    const target = tab.fullPath || tab.path
    if (isSubAppPath(tab.path)) {
      // 子应用路由：navigateTo 使用 window.history.pushState，需手动加上部署前缀
      navigateTo(deployBasePath + target)
    } else {
      navigate(target)
    }
  }

  function hideContextMenu() {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }

  return (
    <div ref={tabBarRef} className={styles.tabBar}>
      <div
        ref={tabListRef}
        className={styles.tabList}
        style={{ transform: `translateX(${scrollLeft}px)` }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`${styles.tabItem}${
              tab.id === activeTabId ? ` ${styles.tabItemActive}` : ''
            }`}
            onClick={() => handleTabClick(tab)}
            onContextMenu={(e) => {
              e.preventDefault()
              onContextMenu(e, tab)
            }}
          >
            <span className={styles.tabTitle}>{tab.title}</span>
            {tab.id !== '/' && (
              <span
                className={styles.tabClose}
                onClick={(e) => {
                  e.stopPropagation()
                  closeTab(tab.id)
                }}
              >
                ×
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 右键菜单（挂到 body） */}
      {contextMenu.visible &&
        createPortal(
          <>
            <div
              className={styles.tabContextMenu}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={styles.contextItem}
                onClick={() => {
                  closeOthers(contextMenu.tabId)
                  hideContextMenu()
                }}
              >
                关闭其他
              </div>
              <div
                className={styles.contextItem}
                onClick={() => {
                  closeAll()
                  hideContextMenu()
                  navigate('/')
                }}
              >
                关闭全部
              </div>
            </div>
            <div className={styles.contextOverlay} onClick={hideContextMenu} />
          </>,
          document.body,
        )}
    </div>
  )
}
