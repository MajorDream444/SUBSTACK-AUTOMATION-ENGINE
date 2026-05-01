#!/usr/bin/env tsx
import { generateArticlePacket } from "../src/content/articlePacket.js";
import { parseArgs, stringArg } from "../src/utils/cli.js";

const args = parseArgs();
const file = stringArg(args, "file");

if (!file) {
  throw new Error("Missing required --file content/raw/example.txt");
}

const outputPath = await generateArticlePacket({
  file,
  title: stringArg(args, "title"),
  lane: stringArg(args, "lane"),
  sourceUrl: stringArg(args, "source-url"),
  sourceTitle: stringArg(args, "source-title")
});

console.log(`Created ${outputPath}`);
