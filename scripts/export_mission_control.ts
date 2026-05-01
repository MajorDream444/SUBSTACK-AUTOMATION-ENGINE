#!/usr/bin/env tsx
import path from "node:path";
import { readArtifact, type ArtifactContract } from "../src/artifacts/artifactContract.js";
import { listFiles, writeText } from "../src/utils/fs.js";
import { timestamp } from "../src/utils/dates.js";

type Counts = Record<string, number>;

function countBy<T extends string>(items: ArtifactContract[], key: (item: ArtifactContract) => T): Counts {
  return items.reduce<Counts>((counts, item) => {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

async function readArtifacts(): Promise<ArtifactContract[]> {
  const dir = "content/logs/agents/artifacts";
  const files = (await listFiles(dir)).filter((file) => file.endsWith(".json"));
  const artifacts: ArtifactContract[] = [];

  for (const file of files) {
    artifacts.push(await readArtifact(path.join(dir, file)));
  }

  return artifacts.sort((a, b) => a.title.localeCompare(b.title));
}

const artifacts = await readArtifacts();
const summary = {
  generated_at: timestamp(),
  total_artifacts: artifacts.length,
  by_status: countBy(artifacts, (artifact) => artifact.status),
  by_lane: countBy(artifacts, (artifact) => artifact.lane),
  needs_review: artifacts.filter((artifact) => artifact.requires_major_review).length,
  blocked: artifacts.filter((artifact) => artifact.status === "blocked" || artifact.publish_mode === "block").length,
  auto_candidates: artifacts.filter((artifact) => artifact.publish_mode === "auto").length,
  high_risk_review_required: artifacts.filter(
    (artifact) => artifact.risk_level === "high" && artifact.requires_major_review
  ).length
};

await writeText(
  "content/logs/workflows/mission_control_export.json",
  `${JSON.stringify({ summary, artifacts }, null, 2)}\n`
);

const markdown = `# Mission Control Export

Generated: ${summary.generated_at}

## Summary

- Total artifacts: ${summary.total_artifacts}
- Needs review: ${summary.needs_review}
- Blocked: ${summary.blocked}
- Auto candidates: ${summary.auto_candidates}
- High risk review required: ${summary.high_risk_review_required}

## By Status

${Object.entries(summary.by_status).map(([status, count]) => `- ${status}: ${count}`).join("\n") || "- None"}

## By Lane

${Object.entries(summary.by_lane).map(([lane, count]) => `- ${lane}: ${count}`).join("\n") || "- None"}

## Artifacts

${
  artifacts
    .map(
      (artifact) => `### ${artifact.title}

- Artifact ID: ${artifact.artifact_id}
- Mission ID: ${artifact.mission_id}
- Type: ${artifact.artifact_type}
- Status: ${artifact.status}
- Lane: ${artifact.lane}
- Score: ${artifact.score}
- Confidence: ${artifact.confidence}
- Risk: ${artifact.risk_level}
- Publish mode: ${artifact.publish_mode}
- Requires Major review: ${artifact.requires_major_review}
- GitHub path: ${artifact.github_path}
- Next action: ${artifact.next_action}`
    )
    .join("\n\n") || "- None"
}
`;

await writeText("content/logs/workflows/mission_control_export.md", markdown);

console.log(`Mission Control artifacts exported: ${artifacts.length}`);
console.log("Wrote content/logs/workflows/mission_control_export.json");
console.log("Wrote content/logs/workflows/mission_control_export.md");
