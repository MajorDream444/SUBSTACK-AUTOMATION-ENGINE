#!/usr/bin/env tsx
import { exportRenderQueueHandoff } from "../src/artifacts/renderQueueHandoff.js";

const result = await exportRenderQueueHandoff();

console.log(`Workflow artifacts scanned: ${result.total_workflow_artifacts}`);
console.log(`Render queue candidates: ${result.render_queue_candidates}`);
console.log(`Queued dry-run items: ${result.queued}`);
console.log(`Skipped candidates: ${result.skipped}`);
console.log("Live publish attempted: no");
console.log("Render attempted: no");
console.log("External API calls: no");
console.log("Wrote content/logs/workflows/render_queue_handoff.json");
console.log("Wrote content/logs/workflows/render_queue_handoff.md");
console.log("Wrote content/logs/workflows/render_queue_handoff_summary.json");
