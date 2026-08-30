import assert from "node:assert/strict";
import test from "node:test";
import { formatLatency, formatLocalTime, formatTokens, formatUsd } from "./usage-format.ts";

void test("formats usage values consistently", () => {
  assert.equal(formatTokens(1250000), "1.25M");
  assert.equal(formatLatency(850), "850 ms");
  assert.equal(formatLatency(1850), "1.85 s");
  assert.equal(formatUsd(0.00001234), "$0.000012");
});

void test("formats zero, null and compact values", () => {
  assert.equal(formatTokens(0), "0");
  assert.equal(formatTokens(999), "999");
  assert.equal(formatTokens(null), "-");
  assert.equal(formatTokens(1250000000), "1.25B");
  assert.equal(formatLatency(null), "-");
  assert.equal(formatUsd(0), "$0.00");
  assert.equal(formatUsd(12), "$12.00");
});

void test("formats timestamps in the browser locale", () => {
  const time = new Date("2026-08-29T12:34:56Z");
  assert.equal(
    formatLocalTime(time.toISOString()),
    new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "medium" }).format(time)
  );
});
