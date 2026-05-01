#!/usr/bin/env tsx
import { importMissionControlDecisions } from "../src/artifacts/decisionImport.js";
import { parseArgs, stringArg } from "../src/utils/cli.js";

const args = parseArgs();
const decisionsPath = stringArg(args, "file") ?? "content/logs/workflows/mission_control_decisions.json";
const results = await importMissionControlDecisions(decisionsPath);

console.log(`Mission Control decisions processed: ${results.length}`);
console.log(`Matched artifacts: ${results.filter((result) => result.matched).length}`);
console.log(`Dry-run reports generated: ${results.filter((result) => result.dry_run_report).length}`);
console.log("Wrote content/logs/workflows/mission_control_decision_import.md");
console.log("Wrote content/logs/workflows/decision_import_summary.json");
