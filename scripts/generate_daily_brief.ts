#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import path from "node:path";
import { listFiles, writeText } from "../src/utils/fs.js";
import { todayIsoDate } from "../src/utils/dates.js";

function gitStatus(): string {
  try {
    return execSync("git status --short", { encoding: "utf8" }).trim() || "Clean worktree";
  } catch {
    return "Git status unavailable";
  }
}

const date = todayIsoDate();
const rawCount = (await listFiles("content/raw")).length;
const articleCount = (await listFiles("content/articles")).length;
const publishedCount = (await listFiles("content/published")).length;
const workflowLogs = await listFiles("content/logs/workflows");
const outputPath = path.join("content", "logs", "daily", `${date}-daily-brief.md`);

const brief = `# Daily Corporate Brief — ${date}

## Executive Summary

Substack Automation Engine scaffold is active in dry-run mode.

## Revenue Actions

- Monetization mapping exists inside article packets.
- No live offers or external revenue integrations are connected yet.

## Content Actions

- Raw thoughts: ${rawCount}
- Article packets: ${articleCount}
- Published records: ${publishedCount}
- Workflow logs: ${workflowLogs.length}

## Repo Changes

\`\`\`
${gitStatus()}
\`\`\`

## Airtable State

See \`content/logs/workflows/airtable_audit.md\`.

## Notion State

Notion mirror is not connected in this scaffold.

## Obsidian / Graphify Notes

Article packets include graph links for Major AI OS, Substack, Systems, and Diaspora Builders.

## Blockers / Needs Major

- Confirm Airtable fields against live records after keys are added.
- Review generated packets before any future publishing workflow.

## Tomorrow’s Top 3

1. Validate Airtable field mapping with real records.
2. Expand dry-run publisher into a browser-safe publishing plan.
3. Add Notion mirror plan after GitHub markdown flow is stable.
`;

await writeText(outputPath, brief);
console.log(`Wrote ${outputPath}`);
