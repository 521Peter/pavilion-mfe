/**
 * 远程依赖解析器。
 * 提取自 chagee 的 @xx/module-federation-vite。
 *
 * 将 pkg@version 表示法转换为 CDN 清单 URL。
 * 支持感知环境的解析（开发环境 → localhost，生产环境 → CDN）。
 */

export interface RemoteConfig {
  [name: string]: string; // "pkg@latest" 或 "pkg@1.2.3"
}

export interface ResolvedRemote {
  [name: string]: string; // 已解析的清单 URL
}

export interface ResolveOptions {
  /** CDN 基础 URL，空字符串表示开发模式（相对路径） */
  cdn?: string;
}

/**
 * 将远程模块规格解析为清单 URL。
 *
 * 感知环境：
 * - cdn 为空（开发）：相对路径 "/mfe/{pkg}/..."（由开发服务器或代理提供）
 * - cdn 已设置（生产）："{cdn}/mfe/{pkg}/..."（由 CDN 托管）
 *
 * @latest    → /mfe/{pkg}/mf-manifest-main.json
 * @1.2.3     → /static/mfe/{pkg}/1.2.3/mf-manifest-main.json
 */
export function resolveRemotes(remotes: RemoteConfig, options?: ResolveOptions): ResolvedRemote {
  const resolved: ResolvedRemote = {};
  const cdn = options?.cdn ?? "";
  const base = cdn ? `${cdn}` : "";

  for (const [key, value] of Object.entries(remotes)) {
    const match = value.match(/(.+)@(.+)/);
    if (!match) {
      throw new Error(`[PavilionMfe] Invalid remote format for '${key}': '${value}'. Expected 'pkg@version'.`);
    }

    const [, pkg, version] = match;

    if (version === "latest") {
      resolved[key] = `${base}/mfe/${pkg}/mf-manifest-main.json`;
    } else {
      resolved[key] = `${base}/static/mfe/${pkg}/${version}/mf-manifest-main.json`;
    }
  }

  return resolved;
}

/**
 * 构建时：生成此子应用版本化产物的基础 URL
 */
export function resolveBuildBase(cdn: string, pkg: string, version: string): string {
  return `${cdn}/mfe/${pkg}/${version}/`;
}

/**
 * 开发时：解析到本地开发服务器
 */
export function resolveDevBase(port: number, pkg: string): string {
  return `http://localhost:${port}/mfe/${pkg}/`;
}
