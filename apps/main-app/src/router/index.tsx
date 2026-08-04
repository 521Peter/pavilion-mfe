import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import Home from '../pages/Home'
import Test from '../pages/Test'
import Env from '../pages/Env'
import Forbidden from '../pages/Forbidden'
import NotFound from '../pages/NotFound'
import ServerError from '../pages/ServerError'
import MFPage from './MFPage'
import { deployBasePath } from '../utils/path'

/** 主应用自有路由 → 标题（用于 Tab / 菜单标题查找） */
export const routeMeta: Record<string, string> = {
  '/': '首页',
  '/test': '测试页',
  '/env': '环境信息',
  '/403': '403',
  '/404': '404',
  '/500': '500',
}

/** 是否主应用自有路由（非微前端子应用路由） */
export function isMainAppRoutePath(path: string): boolean {
  return path in routeMeta
}

// Vite 的 base 配置自动注入为 import.meta.env.BASE_URL
// 本地开发时为 "/"，GitHub Pages 部署时为 "/<repo>/"
export const router = createBrowserRouter(
  [
    {
      element: <MainLayout />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/test', element: <Test /> },
        { path: '/env', element: <Env /> },
        { path: '/403', element: <Forbidden /> },
        { path: '/404', element: <NotFound /> },
        { path: '/500', element: <ServerError /> },
        { path: '*', element: <MFPage /> },
      ],
    },
  ],
  { basename: deployBasePath },
)
