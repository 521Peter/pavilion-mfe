/**
 * 支持按模块开关的 PavilionMfe 共享日志器。
 *
 * 配置方式：
 *   // 编程式配置（应用启动时调用一次）
 *   configureLog({ enabled: true, modules: { sandbox: false } })
 *
 *   // 或通过全局变量配置（脚本加载前）
 *   window.__PAVILION_MFE_LOG__ = { modules: { sandbox: false } }
 *
 * 默认启用所有模块。
 *
 * 输出格式（在浏览器开发者工具中着色）：
 *   [PavilionMfe] router    before-routing   trigger=pushState  url=/git
 *   [PavilionMfe] sandbox   activate         appCode=git-report-generator
 *   [PavilionMfe] router    sub-app-switch   main-app → git-report-generator
 */

export type LogModule = "router" | "sandbox" | "preload" | "bridge";

export interface PavilionMfeLogConfig {
  /** 总开关，设为 false 时禁用全部日志 */
  enabled: boolean;
  /** 按模块设置开关，缺失的键默认为 true */
  modules: Partial<Record<LogModule, boolean>>;
}

const DEFAULT_CONFIG: PavilionMfeLogConfig = {
  enabled: true,
  modules: {}
};

// ─── 用于 console.log %c 格式化的 CSS 样式 ───
const STYLE_PREFIX = "color:#42b883;font-weight:bold";
const STYLE_MODULE = "color:#00b4d8;font-weight:bold";
const STYLE_EVENT = "color:#e8a838;font-weight:bold";
const STYLE_DIM = "color:#999";
const STYLE_ERROR = "color:#ef4444;font-weight:bold";

// ─── 配置读取 ───

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

// ─── 格式化辅助函数 ───

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

// ─── 公共日志函数 ───

export function pavilionMfeLog(module: LogModule, event: string, detail: Record<string, unknown> = {}): void {
  if (!isLogEnabled(module)) return;

  // sub-app-switch 使用特殊格式（使用 → 箭头）
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

  // 通用格式：[PavilionMfe] 模块  事件  key=value  key=value
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
