import { useSyncExternalStore } from 'react'

/** 后端菜单接口返回的数据结构 */
export interface MenuItem {
  menuCode: string
  menuName: string
  menuEnglishName?: string
  menuTp: string
  parentCode: string
  orderNo: number
  status: string
  menuUrl: string
  menuIcon?: string
  childrenMenuInfoList?: MenuItem[]
}

// ─── 极简响应式 store（React 版，替代 Vue 的 ref） ───

let menusData: MenuItem[] = []
const listeners = new Set<() => void>()

function getMenus(): MenuItem[] {
  return menusData
}

function subscribeMenus(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emitChange(): void {
  listeners.forEach((listener) => listener())
}

/** React Hook：订阅菜单数据（配合 useSyncExternalStore，菜单加载完成后自动重渲染） */
export function useMenus(): MenuItem[] {
  return useSyncExternalStore(subscribeMenus, getMenus)
}

/** 缓存的 Promise，避免重复请求 */
let fetchPromise: Promise<MenuItem[]> | null = null

/**
 * 从后端接口获取菜单数据（模拟）
 * 首次调用发起请求，后续调用返回同一 Promise
 */
export function fetchMenus(): Promise<MenuItem[]> {
  if (!fetchPromise) {
    fetchPromise = doFetchMenus()
  }
  return fetchPromise
}

async function doFetchMenus(): Promise<MenuItem[]> {
  const ST_PX = 'color:#42b883;font-weight:bold'
  const ST_DIM = 'color:#999'
  console.log('%c[PavilionMfe]%c 正在从后端获取菜单数据...', ST_PX, ST_DIM)

  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 300))

  const data: MenuItem[] = [
    // ─── 主应用菜单 ───
    {
      menuCode: 'home',
      menuName: '首页',
      menuTp: '0',
      parentCode: '',
      orderNo: 0,
      status: '1',
      menuUrl: '/',
      menuIcon: 'HomeFilled',
    },
    // {
    //   menuCode: 'demo-app',
    //   menuName: 'Demo (Vue)',
    //   menuEnglishName: 'Demo (Vue)',
    //   menuTp: '0',
    //   parentCode: '',
    //   orderNo: 1,
    //   status: '1',
    //   menuUrl: '/demo',
    //   menuIcon: 'Menu',
    //   childrenMenuInfoList: [
    //     { menuCode: 'demo-app/list', menuName: '列表页', menuEnglishName: 'List', menuTp: '1', parentCode: 'demo-app', orderNo: 1, status: '1', menuUrl: '/demo/list', menuIcon: 'Operation' },
    //     { menuCode: 'demo-app/detail', menuName: '详情页', menuEnglishName: 'Detail', menuTp: '1', parentCode: 'demo-app', orderNo: 2, status: '1', menuUrl: '/demo/detail', menuIcon: 'Document' },
    //     { menuCode: 'demo-app/form', menuName: '表单页', menuEnglishName: 'Form', menuTp: '1', parentCode: 'demo-app', orderNo: 3, status: '1', menuUrl: '/demo/form', menuIcon: 'SetUp' },
    //     { menuCode: 'demo-app/test', menuName: '不存在', menuEnglishName: 'Not Found', menuTp: '1', parentCode: 'demo-app', orderNo: 4, status: '1', menuUrl: '/demo/test', menuIcon: 'WarningFilled' },
    //   ],
    // },
    {
      menuCode: 'vue-sub',
      menuName: 'Vue Sub',
      menuEnglishName: 'Vue Sub',
      menuTp: '0',
      parentCode: '',
      orderNo: 2,
      status: '1',
      menuUrl: '/vue-sub',
      menuIcon: 'Collection',
      childrenMenuInfoList: [
        { menuCode: 'vue-sub/test', menuName: '测试页', menuEnglishName: 'Test', menuTp: '1', parentCode: 'vue-sub', orderNo: 1, status: '1', menuUrl: '/vue-sub/test', menuIcon: 'CopyDocument' },
      ],
    },
    {
      menuCode: 'react-app',
      menuName: 'Demo (React)',
      menuEnglishName: 'Demo (React)',
      menuTp: '0',
      parentCode: '',
      orderNo: 3,
      status: '1',
      menuUrl: '/react',
      menuIcon: 'Connection',
      childrenMenuInfoList: [
        { menuCode: 'react-app/list', menuName: '列表页', menuEnglishName: 'List', menuTp: '1', parentCode: 'react-app', orderNo: 1, status: '1', menuUrl: '/react/list', menuIcon: 'DocumentCopy' },
        { menuCode: 'react-app/detail', menuName: '详情页', menuEnglishName: 'Detail', menuTp: '1', parentCode: 'react-app', orderNo: 2, status: '1', menuUrl: '/react/detail', menuIcon: 'Document' },
        { menuCode: 'react-app/dashboard', menuName: '仪表盘', menuEnglishName: 'Dashboard', menuTp: '1', parentCode: 'react-app', orderNo: 3, status: '1', menuUrl: '/react/dashboard', menuIcon: 'DataAnalysis' },
        { menuCode: 'react-app/test', menuName: '不存在', menuEnglishName: 'Not Found', menuTp: '1', parentCode: 'react-app', orderNo: 4, status: '1', menuUrl: '/react/test', menuIcon: 'WarningFilled' },
      ],
    },
    // {
    //   menuCode: 'vue2-app',
    //   menuName: 'Demo (Vue 2)',
    //   menuEnglishName: 'Demo (Vue 2)',
    //   menuTp: '0',
    //   parentCode: '',
    //   orderNo: 4,
    //   status: '1',
    //   menuUrl: '/vue2',
    //   menuIcon: 'IceCream',
    //   childrenMenuInfoList: [
    //     { menuCode: 'vue2-app/list', menuName: '列表页', menuEnglishName: 'List', menuTp: '1', parentCode: 'vue2-app', orderNo: 1, status: '1', menuUrl: '/vue2/list', menuIcon: 'Operation' },
    //     { menuCode: 'vue2-app/detail', menuName: '详情页', menuEnglishName: 'Detail', menuTp: '1', parentCode: 'vue2-app', orderNo: 2, status: '1', menuUrl: '/vue2/detail', menuIcon: 'Document' },
    //     { menuCode: 'vue2-app/form', menuName: '表单页', menuEnglishName: 'Form', menuTp: '1', parentCode: 'vue2-app', orderNo: 3, status: '1', menuUrl: '/vue2/form', menuIcon: 'SetUp' },
    //   ],
    // },
    // ─── 系统工具 ───
    // {
    //   menuCode: 'system',
    //   menuName: '系统工具',
    //   menuTp: '0',
    //   parentCode: '',
    //   orderNo: 99,
    //   status: '1',
    //   menuUrl: '',
    //   menuIcon: 'Setting',
    //   childrenMenuInfoList: [
    //     { menuCode: 'system/test', menuName: '测试页', menuTp: '1', parentCode: 'system', orderNo: 1, status: '1', menuUrl: '/test', menuIcon: 'MostlyCloudy' },
    //     { menuCode: 'system/env', menuName: '环境信息', menuTp: '1', parentCode: 'system', orderNo: 2, status: '1', menuUrl: '/env', menuIcon: 'Position' },
    //   ],
    // },
    // ─── 错误页面 ───
    {
      menuCode: 'error-pages',
      menuName: '错误页面',
      menuTp: '0',
      parentCode: '',
      orderNo: 100,
      status: '1',
      menuUrl: '',
      menuIcon: 'Compass',
      childrenMenuInfoList: [
        { menuCode: 'error-pages/403', menuName: '403 权限不足', menuTp: '1', parentCode: 'error-pages', orderNo: 1, status: '1', menuUrl: '/403', menuIcon: 'Lock' },
        { menuCode: 'error-pages/404', menuName: '404 页面不存在', menuTp: '1', parentCode: 'error-pages', orderNo: 2, status: '1', menuUrl: '/404', menuIcon: 'Guide' },
        { menuCode: 'error-pages/500', menuName: '500 服务器错误', menuTp: '1', parentCode: 'error-pages', orderNo: 3, status: '1', menuUrl: '/500', menuIcon: 'Drizzling' },
      ],
    },
    {
      menuCode: "git-report-generator",
      menuName: "git 报告",
      menuEnglishName: "",
      menuTp: "0",
      parentCode: "",
      orderNo: 5,
      status: "1",
      menuUrl: "/git",
      menuIcon: "Menu",
      childrenMenuInfoList: [],
    },
  ]

  menusData = data
  emitChange()
  console.log('%c[PavilionMfe]%c 菜单数据获取成功，共 %d 个一级菜单', ST_PX, ST_DIM, data.length)
  return data
}
