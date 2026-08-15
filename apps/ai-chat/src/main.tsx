import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ensureDevToken } from '@/api/dev-auth'

const appCode = import.meta.env.VITE_PAVILION_MFE_APP_CODE

/** 挂载应用（独立运行与微前端挂载共用），返回清理函数 */
function renderApp(el: HTMLElement): () => void {
  const root = createRoot(el)
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
  return () => root.unmount()
}

// 子应用单独启动：dev 自动登录后再渲染（登录失败也不阻塞页面）
if (!window.__PAVILION_MFE_ENV__) {
  const root = document.getElementById('root')
  if (root) {
    root.classList.add(`pavilion-mfe-${appCode}`)
    ensureDevToken().finally(() => renderApp(root))
  }
}

export default {
  mount: async (_ctx: unknown, el: HTMLElement) => {
    console.log('[PavilionMfe 微前端] mount', appCode)
    return renderApp(el)
  },
  unmount: async (_ctx: unknown, el: HTMLElement) => {
    console.log('[PavilionMfe 微前端] unmount', appCode)
    el.innerHTML = ''
  },
}
