import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { ConnectionOptions } from "tls";
import { ApiServiceDetail } from "@hodfords/api-gateway";

dotenv.config({ quiet: true });

function parseApiServices(value: string | undefined): ApiServiceDetail[] {
  if (!value) {
    return [];
  }

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error("API_SERVICES must be a JSON array");
  }

  return parsed.map(service => {
    if (!service || typeof service !== "object") {
      throw new Error("Each API_SERVICES entry must be an object");
    }
    const prefix = "prefix" in service && typeof service.prefix === "string" ? service.prefix : undefined;
    const docUrl = "docUrl" in service && typeof service.docUrl === "string" ? service.docUrl : undefined;
    if (!prefix || !docUrl) {
      throw new Error("Each API_SERVICES entry requires prefix and docUrl");
    }
    const host = "host" in service && typeof service.host === "string" ? service.host : new URL(docUrl).origin;
    const directPrefixes =
      "directPrefixes" in service &&
      Array.isArray(service.directPrefixes) &&
      service.directPrefixes.every((item: unknown) => typeof item === "string")
        ? service.directPrefixes
        : undefined;
    const result: ApiServiceDetail = { prefix, docUrl, host };
    if (directPrefixes) result.directPrefixes = directPrefixes;
    return result;
  });
}

/**
 * 根据环境变量构建 Redis TLS 选项。
 * 未启用 `REDIS_TLS` 时返回 `undefined`，使连接保持普通 TCP。
 */
function buildRedisTls(): ConnectionOptions | undefined {
  if (process.env.REDIS_TLS !== "true") {
    return undefined;
  }

  return {
    ...(process.env.REDIS_TLS_CA_FILE ? { ca: readFileSync(process.env.REDIS_TLS_CA_FILE) } : {}),
    ...(process.env.REDIS_TLS_CERT_FILE ? { cert: readFileSync(process.env.REDIS_TLS_CERT_FILE) } : {}),
    ...(process.env.REDIS_TLS_KEY_FILE ? { key: readFileSync(process.env.REDIS_TLS_KEY_FILE) } : {}),
    ...(process.env.REDIS_TLS_SERVERNAME ? { servername: process.env.REDIS_TLS_SERVERNAME } : {}),
    ...(process.env.REDIS_TLS_REJECT_UNAUTHORIZED === "false" ? { rejectUnauthorized: false } : {})
  };
}

/**
 * 网关调用并聚合结果的微服务。
 * 以结构化对象声明，其中 `host` 由 `docUrl` 派生。
 * 可选的 `directPrefixes` 会原样转发给服务，不移除前缀。
 */
const apiServices = parseApiServices(process.env.API_SERVICES);

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:6019")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const requiredSecrets = ["JWT_SECRET", "CREDENTIAL_ENCRYPTION_KEY", "APPLICATION_KEY_PEPPER"] as const;
const missingSecrets = requiredSecrets.filter(name => !process.env[name]?.trim());
if (missingSecrets.length > 0) {
  throw new Error(`Missing required environment variables: ${missingSecrets.join(", ")}`);
}

export const env = {
  APP_PORT: Number(process.env.PORT || process.env.APP_PORT) || 3000, // API 网关端口
  CORS_ORIGINS: corsOrigins,
  API_SERVICES: apiServices, // 网关调用并聚合结果的微服务。
  REDIS: {
    HOST: process.env.REDIS_HOST || "127.0.0.1", // Redis 主机
    PORT: Number(process.env.REDIS_PORT || "6379"), // Redis 端口
    DB: Number(process.env.REDIS_DB || "0"), // Redis 数据库
    USERNAME: process.env.REDIS_USERNAME, // Redis 用户名（ACL）
    PASSWORD: process.env.REDIS_PASSWORD, // Redis 密码
    TLS: buildRedisTls() // Redis TLS 选项，REDIS_TLS 不为 "true" 时是 undefined
  }
};
