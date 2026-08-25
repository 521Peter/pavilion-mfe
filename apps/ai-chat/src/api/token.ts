/**
 * Token 存储约定（与主应用 main-app/src/api/http.ts 保持一致）：
 * - key：pavilion_token
 * - 值：裸 JWT 字符串（不做 JSON 序列化）
 *
 * 挂载模式下子应用与主应用同源，sessionStorage 在当前标签页内共享。
 * 注意：不要用 @pavilion-mfe/bridge 的 StorageSync 读这个 key，
 * 它的 get 会 JSON.parse 裸 JWT 而拿到 null。
 */

export const TOKEN_KEY = "pavilion_token";
export const AUTH_REQUIRED_EVENT = "pavilion:auth-required";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function notifyAuthRequired(): void {
  window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}

/** 是否运行在主应用页面内（token 由主应用登录态提供） */
export function isEmbedded(): boolean {
  return !!window.__PAVILION_MFE_ENV__;
}
