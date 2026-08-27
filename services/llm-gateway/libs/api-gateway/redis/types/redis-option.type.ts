import { ConnectionOptions } from "tls";

export type RedisOptionType = {
  host: string;
  port: number;
  db?: number;
  username?: string;
  password?: string;
  /**
   * 为 Redis 连接启用 TLS。
   * 传入 `true` 使用默认 TLS 设置连接，或传入包含 Node `tls.connect` 选项
   *（ca、cert、key、servername、rejectUnauthorized 等）的对象。
   */
  tls?: boolean | ConnectionOptions;
};
