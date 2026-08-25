import { setToken } from "./token";

type ApiResponse<T> = {
  code: number;
  data: T;
  msg: string;
};

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const result = (await response.json()) as ApiResponse<{ accessToken: string }>;
  if (!response.ok || result.code !== 0 || !result.data?.accessToken) {
    throw new Error(result.msg || "登录失败");
  }
  setToken(result.data.accessToken);
}
