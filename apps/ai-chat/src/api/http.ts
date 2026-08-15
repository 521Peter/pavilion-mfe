/**
 * Platform API HTTP 封装（对齐主应用 main-app/src/api/http.ts 范式）
 * - 相对路径 /api：挂载模式走主应用代理，独立模式走本应用代理，一份代码两态复用
 * - 自动携带 Authorization: Bearer <token>
 * - 401 分模式处理：
 *   - 挂载模式：清 token 跳主应用登录页
 *   - 独立 dev 模式：自动重新登录后重试一次
 */
import { getToken, clearToken, isEmbedded } from "./token";
import { ensureDevToken } from "./dev-auth";

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

export async function http<T = unknown>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined)
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  const json: ApiResponse<T> = await res.json();

  if (json.code !== 0) {
    if (res.status === 401) {
      clearToken();
      if (isEmbedded()) {
        // 挂载模式：交给主应用登录页
        window.location.href = "/login";
      } else if (!retried && (await ensureDevToken(true))) {
        // 独立 dev：自动重登后重试一次
        return http<T>(path, options, true);
      }
    }
    throw new Error(json.msg || "请求失败");
  }

  return json.data;
}

export const api = {
  get: <T = unknown>(path: string) => http<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    http<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    })
};
