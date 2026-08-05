import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { setToken } from '../api/http'
import styles from './Login.module.css'

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
    <div className={styles.wrap}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>PavilionMfe</h1>
        <p className={styles.subtitle}>AI 智能应用套件</p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label}>账号</label>
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>密码</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
          />
        </div>

        <button className={styles.btn} type="submit" disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </button>

        <p className={styles.hint}>默认账号: admin / admin123</p>
      </form>
    </div>
  )
}
