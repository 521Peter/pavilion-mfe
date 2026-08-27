import { setToken } from "./token";

type LoginResponse = {
  code: number;
  msg: string;
  accessToken?: string;
};

function readLoginResponse(value: unknown): LoginResponse | null {
  if (typeof value !== "object" || value === null || !("code" in value) || !("data" in value) || !("msg" in value)) {
    return null;
  }
  const { code, data, msg } = value;
  if (typeof code !== "number" || typeof msg !== "string") return null;
  const accessToken =
    typeof data === "object" && data !== null && "accessToken" in data && typeof data.accessToken === "string"
      ? data.accessToken
      : undefined;
  return { code, msg, accessToken };
}

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const result = readLoginResponse(await response.json());
  if (!result || !response.ok || result.code !== 0 || !result.accessToken) {
    throw new Error(result?.msg || "登录失败");
  }
  setToken(result.accessToken);
}
