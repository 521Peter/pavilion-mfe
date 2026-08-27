export const TOKEN_KEY = "pavilion_token";
export const AUTH_REQUIRED_EVENT = "pavilion:auth-required";

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

export function isEmbedded(): boolean {
  return !!window.__PAVILION_MFE_ENV__;
}

export function notifyAuthRequired(): void {
  window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}

function isTokenExpired(token: string): boolean {
  try {
    const payload: unknown = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return (
      typeof payload !== "object" ||
      payload === null ||
      !("exp" in payload) ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 <= Date.now()
    );
  } catch {
    return true;
  }
}
