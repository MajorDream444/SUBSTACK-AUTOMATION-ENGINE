#!/usr/bin/env tsx
import { exportPublishQueueHandoff } from "../src/artifacts/publishQueueHandoff.js";

const result = await exportPublishQueueHandoff();

console.log(`Workflow artifacts scanned: ${result.total_workflow_artifacts}`);
console.log(`Publish queue candidates: ${result.publish_queue_candidates}`);
console.log(`Queued dry-run items: ${result.queued}`);
console.log(`Skipped candidates: ${result.skipped}`);
console.log("Live publish attempted: no");
console.log("Render attempted: no");
console.log("External API calls: no");
console.log("Wrote content/logs/workflows/publish_queue_handoff.json");
console.log("Wrote content/logs/workflows/publish_queue_handoff.md");
console.log("Wrote content/logs/workflows/publish_queue_handoff_summary.json");
