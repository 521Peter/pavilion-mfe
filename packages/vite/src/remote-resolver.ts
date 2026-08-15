/**
 * Remote dependency resolver.
 * Extracted from chagee's @xx/module-federation-vite.
 *
 * Converts pkg@version notation to CDN manifest URLs.
 * Supports environment-aware resolution (dev → localhost, prod → CDN).
 */

export interface RemoteConfig {
  [name: string]: string; // "pkg@latest" or "pkg@1.2.3"
}

export interface ResolvedRemote {
  [name: string]: string; // resolved manifest URL
}

export interface ResolveOptions {
  /** CDN base URL. Empty string = dev mode (relative paths) */
  cdn?: string;
}

/**
 * Resolve a remote spec to a manifest URL.
 *
 * Environment-aware:
 * - cdn empty (dev): relative path "/mfe/{pkg}/..." (served by dev server or proxy)
 * - cdn set (prod): "{cdn}/mfe/{pkg}/..." (CDN-hosted)
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
 * Build-time: generate the base URL for this sub-app's versioned output
 */
export function resolveBuildBase(cdn: string, pkg: string, version: string): string {
  return `${cdn}/mfe/${pkg}/${version}/`;
}

/**
 * Dev-time: resolve to local dev server
 */
export function resolveDevBase(port: number, pkg: string): string {
  return `http://localhost:${port}/mfe/${pkg}/`;
}
