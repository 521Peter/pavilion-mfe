import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "@heroui/react";
import { login } from "../api/auth";
import { setToken } from "../api/http";
import logoSvg from "../assets/pavilion-mfe-logo.svg";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { accessToken } = await login(username, password);
      setToken(accessToken);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
      <form
        className="w-[360px] py-10 px-8 rounded-2xl bg-[#1e293b] shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col items-center mb-8">
          <img className="w-14 h-14 mb-3" src={logoSvg} alt="PavilionMfe" />
          <h1 className="m-0 text-[22px] font-bold text-[#f1f5f9]">PavilionMfe</h1>
          <p className="m-0 mt-1.5 text-sm text-[#64748b]">AI 智能应用套件</p>
        </div>

        {error && (
          <div className="mb-5 py-2.5 px-3 rounded-lg bg-[rgba(239,68,68,0.1)] text-[#f87171] text-[13px]">{error}</div>
        )}

        <div className="mb-5">
          <label className="block mb-1.5 text-[13px] text-[#94a3b8]">账号</label>
          <Input
            variant="primary"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoFocus
            fullWidth
          />
        </div>

        <div className="mb-6">
          <label className="block mb-1.5 text-[13px] text-[#94a3b8]">密码</label>
          <Input
            variant="primary"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="请输入密码"
            fullWidth
          />
        </div>

        <Button type="submit" variant="primary" fullWidth isDisabled={loading}>
          {loading ? "登录中..." : "登 录"}
        </Button>

        <p className="mt-5 text-center text-xs text-[#475569]">默认账号: admin / admin123</p>
      </form>
    </div>
  );
}
