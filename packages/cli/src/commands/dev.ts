import { fork } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export async function devCommand(options: { config?: string; filter?: string[] }): Promise<void> {
  const wsServerPath = resolve(__dirname, "../../src/ws-server.ts");
  const wsProcess = fork(wsServerPath, [], { stdio: "pipe" });

  wsProcess.on("spawn", () => {
    console.log("[PavilionMfe] Dev discovery service started");
  });

  console.log("[PavilionMfe] Starting development servers...");
  console.log("[PavilionMfe] Run `pavilion-mfe dev` from your project root directory");

  process.on("SIGINT", () => {
    wsProcess.kill();
    process.exit(0);
  });
}
