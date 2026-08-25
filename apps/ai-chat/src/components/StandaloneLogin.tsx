import { useState } from "react";
import type { FormEvent } from "react";
import { Bot, LockKeyhole, MessageSquareText } from "lucide-react";
import { login } from "@/api/auth";

export function StandaloneLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
  }

  return (
    <main className="flex h-full min-h-[520px] items-center justify-center bg-slate-950 px-4 py-8">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl md:grid-cols-[1.05fr_1fr]">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-10 text-white md:flex">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-wide">
            <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <MessageSquareText className="size-5" aria-hidden="true" />
            </span>
            Pavilion AI
          </div>
          <div>
            <span className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-white/15">
              <Bot className="size-8" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight">AI 对话工作台</h1>
            <p className="mt-3 max-w-sm text-base leading-7 text-indigo-100">登录后即可继续你的对话与任务。</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-100">
            <LockKeyhole className="size-4" aria-hidden="true" />
            登录凭据仅用于本次认证
          </div>
        </div>

        <form className="p-7 sm:p-10" onSubmit={handleSubmit}>
          <div className="mb-8">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 md:hidden">
              <MessageSquareText className="size-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-indigo-600">Pavilion AI</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">欢迎回来</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">请使用与主应用相同的账号登录。</p>
          </div>

          {error ? (
            <div
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">账号</span>
              <input
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="请输入用户名"
                autoComplete="username"
                autoFocus
                required
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">密码</span>
              <input
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                required
              />
            </label>
          </div>

          <button
            className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-base font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={loading || !username.trim() || !password}
          >
            {loading ? "登录中…" : "登录并进入对话"}
          </button>
          <p className="mt-5 text-center text-xs leading-5 text-slate-500">Access Token 仅保存在当前浏览器标签页中。</p>
        </form>
      </section>
    </main>
  );
}
