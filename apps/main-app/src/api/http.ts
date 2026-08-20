/**
 * Platform API HTTP 封装
 * 自动携带 JWT Token，401 时清除登录态并跳转登录页
 */

const TOKEN_KEY = "pavilion_token";

export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token && isTokenExpired(token)) {
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  msg: string;
}

export async function http<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
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
      window.location.href = "/login";
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
