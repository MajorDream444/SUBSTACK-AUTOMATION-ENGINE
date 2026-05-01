#!/usr/bin/env tsx
import { generateArticlePacket } from "../src/content/articlePacket.js";

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
  throw new Error("Missing required --file content/raw/example.txt");
}

const outputPath = await generateArticlePacket({
  file,
  title: typeof args.title === "string" ? args.title : undefined,
  lane: typeof args.lane === "string" ? args.lane : undefined,
  sourceUrl: typeof args["source-url"] === "string" ? args["source-url"] : undefined,
  sourceTitle: typeof args["source-title"] === "string" ? args["source-title"] : undefined
});

console.log(`Created ${outputPath}`);
