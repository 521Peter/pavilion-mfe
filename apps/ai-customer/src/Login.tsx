import { useState } from "react";
import type { FormEvent } from "react";
import { Bot, LockKeyhole, Sparkles } from "lucide-react";
import { login } from "./api/auth";

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      onSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-intro" aria-label="AI 客服介绍">
        <div className="login-brand">
          <Sparkles size={22} aria-hidden="true" />
          <span>Pavilion Support</span>
        </div>
        <div>
          <div className="login-bot" aria-hidden="true">
            <Bot size={34} />
          </div>
          <p className="eyebrow">AI CUSTOMER SERVICE</p>
          <h1>更快地响应每一个问题</h1>
          <p>登录 AI 客服工作台，通过统一网关安全访问客服服务。</p>
        </div>
        <p className="login-security">
          <LockKeyhole size={16} aria-hidden="true" />
          当前会话关闭后将自动退出
        </p>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={submit}>
          <div>
            <p className="login-kicker">独立应用登录</p>
            <h2>欢迎回来</h2>
            <p className="login-subtitle">请使用与主应用相同的企业账号登录</p>
          </div>

          {error ? (
            <div className="login-error" role="alert">
              {error}
            </div>
          ) : null}

          <label>
            <span>账号</span>
            <input
              value={username}
              onChange={event => setUsername(event.target.value)}
              placeholder="请输入用户名"
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              placeholder="请输入密码"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "登录中…" : "登录并进入工作台"}
          </button>
          <p className="login-tip">Access Token 仅保存在当前浏览器标签页中。</p>
        </form>
      </section>
    </main>
  );
}
