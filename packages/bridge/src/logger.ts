/**
 * Self-contained logger for @pavilion-mfe/bridge.
 *
 * Bridge is a standalone package with no dependencies on other PavilionMfe
 * packages. This logger reads the same global config
 * (window.__PAVILION_MFE_LOG__) as @pavilion-mfe/sandbox's logger, ensuring
 * consistent output format and module toggling across all packages.
 *
 * See @pavilion-mfe/sandbox/src/logger.ts for the canonical implementation.
 */

const STYLE_PREFIX = "color:#42b883;font-weight:bold";
const STYLE_MODULE = "color:#00b4d8;font-weight:bold";
const STYLE_EVENT = "color:#e8a838;font-weight:bold";
const STYLE_DIM = "color:#999";

function isLogEnabled(): boolean {
  const g = globalThis as Record<string, any>;
  const config = g.__PAVILION_MFE_LOG__;
  if (!config) return true;
  if (config.enabled === false) return false;
  return config.modules?.bridge ?? true;
}

function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.join(", ");
  return JSON.stringify(v);
}

export function bridgeLog(event: string, detail: Record<string, unknown> = {}): void {
  if (!isLogEnabled()) return;

  const pairs = Object.entries(detail)
    .map(([k, v]) => `${k}=${formatValue(v)}`)
    .join("  ");

  if (pairs) {
    console.log("%c[PavilionMfe]%c bridge%c %s%c %s", STYLE_PREFIX, STYLE_MODULE, STYLE_EVENT, event, STYLE_DIM, pairs);
  } else {
    console.log("%c[PavilionMfe]%c bridge%c %s", STYLE_PREFIX, STYLE_MODULE, STYLE_EVENT, event);
  }
}
