/**
 * 独立开发模式自动登录（仅 dev 生效，生产构建直接跳过）。
 *
 * 三种情况不处理，token 由别的机制负责：
 * - 生产构建：ensureDevToken 永远返回 false
 * - 挂载模式：token 由主应用登录态写入同源 localStorage
 * - 已有 token：直接复用，过期后由 http.ts 401 兜底重登
 */
import { getToken, setToken, isEmbedded } from './token'

const DEV_USERNAME = import.meta.env.VITE_DEV_LOGIN_USERNAME || 'admin'
const DEV_PASSWORD = import.meta.env.VITE_DEV_LOGIN_PASSWORD || 'admin123'

export async function ensureDevToken(force = false): Promise<boolean> {
  if (import.meta.env.PROD) return false
  if (isEmbedded()) return false
  if (!force && getToken()) return true

  try {
    // 直接 fetch 登录接口，不走 http.ts（避免 401 重试逻辑递归）
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: DEV_USERNAME, password: DEV_PASSWORD }),
    })
    const json = await res.json()
    if (json.code !== 0 || !json.data?.accessToken) {
      throw new Error(json.msg || '登录失败')
    }
    setToken(json.data.accessToken)
    console.log('[ai-chat] dev 自动登录成功')
    return true
  } catch (err) {
    console.warn('[ai-chat] dev 自动登录失败（后端未启动或账号不可用）:', err)
    return false
  }
}
