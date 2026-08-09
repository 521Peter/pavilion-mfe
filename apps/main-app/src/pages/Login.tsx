import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { setToken } from '../api/http'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { accessToken } = await login(username, password)
      setToken(accessToken)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <form className="w-[360px] py-10 px-8 rounded-lg bg-[#1e293b] shadow-[0_8px_32px_rgba(0,0,0,0.3)]" onSubmit={handleSubmit}>
        <h1 className="m-0 mb-2 text-[22px] font-semibold text-[#f1f5f9] text-center">PavilionMfe</h1>
        <p className="m-0 mb-8 text-sm text-[#64748b] text-center">AI 智能应用套件</p>

        {error && (
          <div className="m-0 mb-4 py-2.5 px-3 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[13px]">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block mb-1.5 text-[13px] text-[#94a3b8]">账号</label>
          <input
            className="w-full py-2.5 px-3 border border-[#334155] rounded-lg bg-[#0f172a] text-[#f1f5f9] text-sm outline-none box-border transition-colors focus:border-[#3b82f6] placeholder:text-[#475569]"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoFocus
          />
        </div>

        <div className="mb-5">
          <label className="block mb-1.5 text-[13px] text-[#94a3b8]">密码</label>
          <input
            className="w-full py-2.5 px-3 border border-[#334155] rounded-lg bg-[#0f172a] text-[#f1f5f9] text-sm outline-none box-border transition-colors focus:border-[#3b82f6] placeholder:text-[#475569]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
          />
        </div>

        <button
          className="w-full p-[11px] border-none rounded-lg bg-[#3b82f6] text-white text-[15px] font-medium cursor-pointer transition-colors hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? '登录中...' : '登 录'}
        </button>

        <p className="mt-4 text-center text-xs text-[#475569]">默认账号: admin / admin123</p>
      </form>
    </div>
  )
}
