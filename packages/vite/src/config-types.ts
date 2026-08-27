import type { ProxyOptions } from "vite";

export interface FederationUserOptions {
  name?: string;
  exposes?: Record<string, string>;
  remotes?: Record<string, string>;
  shared?: string[];
  shareStrategy?: "loaded-first" | "version-first";
  runtimePlugins?: string[];
  manifest?: boolean | { fileName?: string; filePath?: string };
}

export interface PavilionMfePluginOptions extends FederationUserOptions {
  role: "main-app" | "sub-app" | "runtime" | "login";

  /** pkg@version → 解析为 CDN 清单 URL */
  pavilionMfeRemotes?: Record<string, string>;

  /** 构建时 CDN 基础 URL */
  cdn?: string;

  /** 开发服务器端口（用于 WS 发现） */
  port?: number;

  /** 启用开发时 WS 端口发现 */
  openDevServe?: boolean;

  /** CSS 作用域：排除前缀处理的文件 */
  cssExclude?: RegExp[];

  /** DTS 类型生成/消费，设为 false 可禁用 */
  dts?:
    | boolean
    | {
        generateTypes?: boolean | Record<string, unknown>;
        consumeTypes?: boolean | Record<string, unknown>;
      };

  /** 开发服务器代理规则（仅开发模式） */
  proxy?: Record<string, string | ProxyOptions>;

  /** 当前环境（如 'develop'、'production'），未设置时使用 VITE_PAVILION_MFE_ENV 环境变量 */
  env?: string;
}
