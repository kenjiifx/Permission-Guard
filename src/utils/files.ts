import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

async function collectJsonFiles(dir: string, acc: string[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name.startsWith(".git")) continue;
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await collectJsonFiles(full, acc);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) {
      acc.push(full);
    }
  }
}

export async function discoverPolicyJsonFiles(targetPath: string): Promise<string[]> {
  const absolute = resolve(targetPath);
  const info = await stat(absolute);
  if (info.isFile()) return [absolute];
  if (!info.isDirectory()) return [];

  const files: string[] = [];
  await collectJsonFiles(absolute, files);
  return files.sort((a, b) => a.localeCompare(b));
}
