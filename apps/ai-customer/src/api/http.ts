import { clearToken, getToken, isEmbedded, notifyAuthRequired } from "./token";

type ApiResponse<T> = { code: number; data: T; msg: string };

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`/api/customer-service${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (response.status === 401 || response.status === 403) {
    clearToken();
    if (isEmbedded()) {
      window.location.href = "/login";
    } else {
      notifyAuthRequired();
    }
    throw new Error("登录状态已失效，请重新登录");
  }

  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || result.code !== 0) {
    throw new Error(result.msg || `请求失败（${response.status}）`);
  }
  return result.data;
}
