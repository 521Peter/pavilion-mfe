const TOKEN_UNITS = [
  { limit: 1_000_000_000, suffix: "B" },
  { limit: 1_000_000, suffix: "M" },
  { limit: 1_000, suffix: "K" }
] as const;

export function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (Math.abs(value) < 1_000) return String(value);

  const unit = TOKEN_UNITS.find(item => Math.abs(value) >= item.limit);
  if (!unit) return String(value);
  return `${(value / unit.limit).toFixed(2)}${unit.suffix}`;
}

export function formatLatency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (Math.abs(value) < 1_000) return `${value} ms`;
  return `${(value / 1_000).toFixed(2)} s`;
}

export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (Math.abs(value) >= 0.01) return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
  if (value === 0) return "$0.00";
  return `$${value.toFixed(6)}`;
}

export function formatLocalTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "medium" }).format(date);
}
