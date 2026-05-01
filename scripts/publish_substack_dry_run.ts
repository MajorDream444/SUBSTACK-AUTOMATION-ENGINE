#!/usr/bin/env tsx
import { publishDryRun } from "../src/substack/dryRunPublisher.js";

function parseArgs(argv = process.argv.slice(2)): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

const args = parseArgs();
const file = typeof args.file === "string" ? args.file : undefined;

if (!file) {
  throw new Error("Missing required --file content/articles/example.md");
}

const reportPath = await publishDryRun({ file });
console.log(`Wrote ${reportPath}`);
