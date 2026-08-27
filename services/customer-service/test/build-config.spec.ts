import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

describe("customer-service build config", () => {
  it("re-emits the entry point after the output directory is removed", () => {
    const serviceRoot = resolve(__dirname, "..");
    const fixtureRoot = mkdtempSync(join(tmpdir(), "customer-service-build-"));

    try {
      cpSync(join(serviceRoot, "tsconfig.json"), join(fixtureRoot, "tsconfig.json"));
      cpSync(join(serviceRoot, "tsconfig.build.json"), join(fixtureRoot, "tsconfig.build.json"));
      mkdirSync(join(fixtureRoot, "src"));
      writeFileSync(join(fixtureRoot, "src", "main.ts"), "export const ready = true;\n");

      const tsc = require.resolve("typescript/bin/tsc");
      const tscArgs = [tsc, "-p", "tsconfig.build.json", "--typeRoots", join(serviceRoot, "node_modules", "@types")];
      execFileSync(process.execPath, tscArgs, { cwd: fixtureRoot });
      rmSync(join(fixtureRoot, "dist"), { recursive: true });
      execFileSync(process.execPath, tscArgs, { cwd: fixtureRoot });

      expect(existsSync(join(fixtureRoot, "dist", "main.js"))).toBe(true);
    } finally {
      rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });
});
