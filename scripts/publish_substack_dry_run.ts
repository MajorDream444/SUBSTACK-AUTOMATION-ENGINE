#!/usr/bin/env tsx
import { publishDryRun } from "../src/substack/dryRunPublisher.js";
import { parseArgs, stringArg } from "../src/utils/cli.js";

const args = parseArgs();
const file = stringArg(args, "file");

if (!file) {
  throw new Error("Missing required --file content/articles/example.md");
}

const reportPath = await publishDryRun({ file });
console.log(`Wrote ${reportPath}`);
