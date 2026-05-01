#!/usr/bin/env tsx
import { hasAirtableCredentials } from "../src/config/env.js";
import { listSubstackPipelineRecords } from "../src/airtable/client.js";
import type { AirtableRecord } from "../src/airtable/client.js";
import { normalizeAirtableRecord, renderAirtableAudit } from "../src/airtable/mapper.js";
import { writeText } from "../src/utils/fs.js";

let records: AirtableRecord[] = [];
let skippedReason: string | undefined;

if (!hasAirtableCredentials()) {
  skippedReason = "no AIRTABLE_API_KEY found";
} else {
  records = await listSubstackPipelineRecords();
}

await writeText(
  "content/logs/workflows/airtable_snapshot.json",
  `${JSON.stringify(records.map(normalizeAirtableRecord), null, 2)}\n`
);
await writeText("content/logs/workflows/airtable_audit.md", renderAirtableAudit(records, skippedReason));

console.log(`Airtable records read: ${records.length}`);
console.log("Wrote content/logs/workflows/airtable_snapshot.json");
console.log("Wrote content/logs/workflows/airtable_audit.md");
