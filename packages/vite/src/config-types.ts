import type { PluginOption, ProxyOptions } from "vite";

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

  /** pkg@version → resolves to CDN manifest URL */
  pavilionMfeRemotes?: Record<string, string>;

  /** Build-time CDN base URL */
  cdn?: string;

  /** Dev server port (used for WS discovery) */
  port?: number;

  /** Enable dev-time WS port discovery */
  openDevServe?: boolean;

  /** CSS scope: files to exclude from prefixing */
  cssExclude?: RegExp[];

  /** DTS type generation/consumption. Set false to disable. */
  dts?:
    | boolean
    | {
        generateTypes?: boolean | Record<string, unknown>;
        consumeTypes?: boolean | Record<string, unknown>;
      };

  /** Dev server proxy rules (dev mode only) */
  proxy?: Record<string, string | ProxyOptions>;

  /** Current environment (e.g. 'develop', 'production'). Falls back to VITE_PAVILION_MFE_ENV env var. */
  env?: string;
}
