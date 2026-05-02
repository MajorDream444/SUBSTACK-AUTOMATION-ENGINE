#!/usr/bin/env tsx
import { importAssetQueueDecisions } from "../src/artifacts/assetDecisionImport.js";
import { parseArgs, stringArg } from "../src/utils/cli.js";

const args = parseArgs();
const decisionsPath = stringArg(args, "file");
const result = await importAssetQueueDecisions(decisionsPath);

console.log(`Mission Control asset queue decisions in file: ${result.decisions_in_file}`);
console.log(`New decisions imported: ${result.new_decisions_imported}`);
console.log(`Duplicates ignored: ${result.duplicates_ignored}`);
console.log(`Artifacts tracked: ${result.artifacts_tracked}`);
console.log("Live publish attempted: no");
console.log("Render attempted: no");
console.log("External API calls: no");
console.log(`Wrote ${result.local_copy_path}`);
console.log(`Wrote ${result.report_path}`);
console.log(`Wrote ${result.state_path}`);
console.log(`Wrote ${result.summary_path}`);
