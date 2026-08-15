#!/usr/bin/env node

import { execSync } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distMain = resolve(__dirname, "../dist/index.js");

// Fallback to tsx for development
try {
  await import(distMain);
} catch {
  // Use tsx if running from source
  execSync(`npx tsx ${resolve(__dirname, "../src/index.ts")} ${process.argv.slice(2).join(" ")}`, {
    stdio: "inherit"
  });
}
