#!/usr/bin/env tsx
import { hasAirtableCredentials } from "../src/config/env.js";
import { listSubstackPipelineRecords } from "../src/airtable/client.js";
import type { AirtableRecord } from "../src/airtable/client.js";
import { normalizeAirtableRecord, renderAirtableAudit } from "../src/airtable/mapper.js";
import { runReactionDoctrineDryRun } from "../src/content/reactionDoctrine.js";
import { boolArg, parseArgs, stringArg } from "../src/utils/cli.js";
import { readText, writeText } from "../src/utils/fs.js";

const args = parseArgs();
const fixturePath = stringArg(args, "fixture");
const writeRequested = boolArg(args, "write");
let records: AirtableRecord[] = [];
let skippedReason: string | undefined;

if (writeRequested) {
  console.log("Write flag detected. Airtable mutations are not implemented yet; this run remains read-only.");
}

if (fixturePath) {
  const fixture = JSON.parse(await readText(fixturePath)) as { records?: AirtableRecord[] } | AirtableRecord[];
  records = Array.isArray(fixture) ? fixture : fixture.records ?? [];
} else if (!hasAirtableCredentials()) {
  skippedReason = "no AIRTABLE_API_KEY found";
} else {
  records = await listSubstackPipelineRecords();
}

await writeText(
  "content/logs/workflows/airtable_snapshot.json",
  `${JSON.stringify(records.map(normalizeAirtableRecord), null, 2)}\n`
);
await writeText("content/logs/workflows/airtable_audit.md", renderAirtableAudit(records, skippedReason));
const reactionResults = await runReactionDoctrineDryRun(records);

console.log(`Airtable records read: ${records.length}`);
console.log(`Reaction Doctrine candidates processed: ${reactionResults.length}`);
console.log("Wrote content/logs/workflows/airtable_snapshot.json");
console.log("Wrote content/logs/workflows/airtable_audit.md");
console.log("Wrote content/logs/workflows/reaction_doctrine_pipeline.md");
