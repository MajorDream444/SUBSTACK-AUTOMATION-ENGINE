import fs from "fs-extra";
import path from "node:path";

export async function readText(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function listFiles(dirPath: string): Promise<string[]> {
  if (!(await fs.pathExists(dirPath))) return [];
  const entries = await fs.readdir(dirPath);
  return entries.filter((entry) => !entry.startsWith("."));
}
