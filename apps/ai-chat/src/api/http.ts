/**
 * Platform API HTTP 封装（对齐主应用 main-app/src/api/http.ts 范式）
 * - 相对路径 /api：挂载模式走主应用代理，独立模式走本应用代理，一份代码两态复用
 * - 自动携带 Authorization: Bearer <token>
 * - 401 时清除失效 token；挂载模式跳转主应用登录页
 */
import { getToken, clearToken, isEmbedded, notifyAuthRequired } from "./token";

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

export async function authorizedFetch(path: string, options: RequestInit = {}): Promise<Response> {
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

  if (res.status === 401) {
    clearToken();
    if (isEmbedded()) {
      window.location.href = "/login";
    } else {
      notifyAuthRequired();
    }
  }

  return res;
}

export async function http<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await authorizedFetch(path, options);

  const json: ApiResponse<T> = await res.json();

  if (json.code !== 0) {
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
    }),
  patch: <T = unknown>(path: string, body: unknown) => http<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = unknown>(path: string) => http<T>(path, { method: "DELETE" })
};
