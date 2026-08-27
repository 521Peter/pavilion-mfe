import { clearToken, getToken, isEmbedded, notifyAuthRequired } from "./token";

function readApiEnvelope(value: unknown): { code: number; data: unknown; msg: string } | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("code" in value) ||
    typeof value.code !== "number" ||
    !("data" in value) ||
    !("msg" in value) ||
    typeof value.msg !== "string"
  ) {
    return null;
  }
  return { code: value.code, data: value.data, msg: value.msg };
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(`/api/customer-service${path}`, {
    ...options,
    headers
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

  const result = readApiEnvelope(await response.json());
  if (!result || !response.ok || result.code !== 0) {
    throw new Error(result?.msg || `请求失败（${response.status}）`);
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- endpoint caller supplies T; the shared layer validates only the transport envelope
  return result.data as T;
}
