#!/usr/bin/env tsx
import { generateAssets } from "../src/artifacts/assetGeneration.js";

const results = await generateAssets();

console.log(`Artifacts scanned: ${results.length}`);
console.log(`Assets generated: ${results.filter((result) => !result.skipped).length}`);
console.log(`Assets skipped: ${results.filter((result) => result.skipped).length}`);
console.log("Wrote content/logs/workflows/asset_generation_log.md");
console.log("Wrote content/logs/workflows/asset_generation_log.json");
console.log("Wrote content/logs/workflows/asset_generation_summary.json");
