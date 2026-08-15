export async function buildCommand(options: { name?: string; version?: string; env?: string }): Promise<void> {
  console.log("[PavilionMfe] Building...");
  console.log("[PavilionMfe] ", JSON.stringify(options, null, 2));
}
