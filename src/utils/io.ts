import { readFile, writeFile } from "node:fs/promises";

export async function readJsonFile(path: string): Promise<unknown> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

export async function readJsonFromStdin(): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) throw new Error("STDIN input is empty.");
  return JSON.parse(raw);
}

export async function writeJsonFile(path: string, data: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await writeFile(path, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}
