/**
 * Shared PavilionMfe logger with per-module toggle support.
 *
 * Configuration:
 *   // Programmatic (call once at app startup)
 *   configureLog({ enabled: true, modules: { sandbox: false } })
 *
 *   // Or via global (before scripts load)
 *   window.__PAVILION_MFE_LOG__ = { modules: { sandbox: false } }
 *
 * Default: all modules enabled.
 *
 * Output format (colorized in browser DevTools):
 *   [PavilionMfe] router    before-routing   trigger=pushState  url=/git
 *   [PavilionMfe] sandbox   activate         appCode=git-report-generator
 *   [PavilionMfe] router    sub-app-switch   main-app → git-report-generator
 */

export type LogModule = "router" | "sandbox" | "preload" | "bridge";

export interface PavilionMfeLogConfig {
  /** Master switch — when false, all logging is disabled */
  enabled: boolean;
  /** Per-module toggles. Missing keys default to true. */
  modules: Partial<Record<LogModule, boolean>>;
}

const DEFAULT_CONFIG: PavilionMfeLogConfig = {
  enabled: true,
  modules: {}
};

// ─── CSS styles for console.log %c formatting ───
const STYLE_PREFIX = "color:#42b883;font-weight:bold";
const STYLE_MODULE = "color:#00b4d8;font-weight:bold";
const STYLE_EVENT = "color:#e8a838;font-weight:bold";
const STYLE_DIM = "color:#999";
const STYLE_ERROR = "color:#ef4444;font-weight:bold";

// ─── Config reader ───

function getConfig(): PavilionMfeLogConfig {
  const g = globalThis as Record<string, unknown>;
  const globalConfig = g.__PAVILION_MFE_LOG__ as Partial<PavilionMfeLogConfig> | undefined;
  if (!globalConfig) return DEFAULT_CONFIG;
  return {
    enabled: globalConfig.enabled ?? DEFAULT_CONFIG.enabled,
    modules: { ...DEFAULT_CONFIG.modules, ...globalConfig.modules }
  };
}

export function isLogEnabled(module: LogModule): boolean {
  const config = getConfig();
  if (!config.enabled) return false;
  return config.modules[module] ?? true;
}

export function configureLog(config: Partial<PavilionMfeLogConfig>): void {
  const current = getConfig();
  const g = globalThis as Record<string, unknown>;
  g.__PAVILION_MFE_LOG__ = {
    enabled: config.enabled ?? current.enabled,
    modules: { ...current.modules, ...config.modules }
  };
}

// ─── Formatting helpers ───

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.join(", ");
  return JSON.stringify(v);
}

function formatPairs(detail: Record<string, unknown>): string {
  return Object.entries(detail)
    .map(([k, v]) => `${k}=${formatValue(v)}`)
    .join("  ");
}

// ─── Public log functions ───

export function pavilionMfeLog(module: LogModule, event: string, detail: Record<string, unknown> = {}): void {
  if (!isLogEnabled(module)) return;

  // Special format for sub-app-switch (uses → arrow)
  if (event === "sub-app-switch") {
    const from = detail.from as string[] | undefined;
    const to = detail.to as string[] | undefined;
    console.log(
      "%c[PavilionMfe]%c %s%c %s%c %s → %s",
      STYLE_PREFIX,
      STYLE_MODULE,
      module,
      STYLE_EVENT,
      event,
      STYLE_DIM,
      from && from.length ? from.join(", ") : "(none)",
      to && to.length ? to.join(", ") : "(none)"
    );
    return;
  }

  // Generic format: [PavilionMfe] module  event  key=value  key=value
  const pairs = formatPairs(detail);
  if (pairs) {
    console.log(
      "%c[PavilionMfe]%c %s%c %s%c %s",
      STYLE_PREFIX,
      STYLE_MODULE,
      module,
      STYLE_EVENT,
      event,
      STYLE_DIM,
      pairs
    );
  } else {
    console.log("%c[PavilionMfe]%c %s%c %s", STYLE_PREFIX, STYLE_MODULE, module, STYLE_EVENT, event);
  }
}

export function pavilionMfeError(module: LogModule, event: string, detail: Record<string, unknown> = {}): void {
  if (!isLogEnabled(module)) return;

  const pairs = formatPairs(detail);
  if (pairs) {
    console.error(
      "%c[PavilionMfe]%c %s%c %s%c %s",
      STYLE_PREFIX,
      STYLE_MODULE,
      module,
      STYLE_ERROR,
      event,
      STYLE_DIM,
      pairs
    );
  } else {
    console.error("%c[PavilionMfe]%c %s%c %s", STYLE_PREFIX, STYLE_MODULE, module, STYLE_ERROR, event);
  }
}
