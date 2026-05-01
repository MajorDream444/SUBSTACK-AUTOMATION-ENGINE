import path from "node:path";
import { z } from "zod";
import { readArtifact, writeArtifact, type ArtifactContract } from "./artifactContract.js";
import { publishDryRun } from "../substack/dryRunPublisher.js";
import { listFiles, readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

const MissionControlDecisionSchema = z.object({
  artifact_id: z.string().uuid(),
  decision: z.enum(["approved", "rejected", "rewrite_requested", "publish_requested"]),
  mission_id: z.string().optional(),
  decided_by: z.string().optional(),
  reason: z.string().optional(),
  next_action: z.string().optional()
});

const DecisionsFileSchema = z.union([
  z.array(MissionControlDecisionSchema),
  z.object({
    decisions: z.array(MissionControlDecisionSchema)
  })
]);

export type MissionControlDecision = z.infer<typeof MissionControlDecisionSchema>;

type DecisionImportResult = {
  artifact_id: string;
  title?: string;
  decision: MissionControlDecision["decision"];
  previous_status?: ArtifactContract["status"];
  new_status?: ArtifactContract["status"];
  artifact_path?: string;
  dry_run_report?: string;
  matched: boolean;
  message: string;
};

function statusForDecision(decision: MissionControlDecision["decision"]): ArtifactContract["status"] {
  switch (decision) {
    case "approved":
      return "ready";
    case "rejected":
      return "blocked";
    case "rewrite_requested":
      return "needs_rewrite";
    case "publish_requested":
      return "scheduled_dry_run";
  }
}

function nextActionForDecision(decision: MissionControlDecision): string {
  if (decision.next_action) return decision.next_action;
  switch (decision.decision) {
    case "approved":
      return "Ready for Command Center routing.";
    case "rejected":
      return "Blocked by Mission Control decision.";
    case "rewrite_requested":
      return "Rewrite requested by Mission Control.";
    case "publish_requested":
      return "Run Substack dry-run only; live publishing remains disabled.";
  }
}

async function artifactIndex(): Promise<Map<string, { filePath: string; artifact: ArtifactContract }>> {
  const dir = "content/logs/agents/artifacts";
  const files = (await listFiles(dir)).filter((file) => file.endsWith(".json"));
  const index = new Map<string, { filePath: string; artifact: ArtifactContract }>();

  for (const file of files) {
    const filePath = path.join(dir, file);
    const artifact = await readArtifact(filePath);
    index.set(artifact.artifact_id, { filePath, artifact });
  }

  return index;
}

async function readDecisions(decisionsPath: string): Promise<MissionControlDecision[]> {
  const parsed = DecisionsFileSchema.parse(JSON.parse(await readText(decisionsPath)));
  return Array.isArray(parsed) ? parsed : parsed.decisions;
}

export async function importMissionControlDecisions(
  decisionsPath = "content/logs/workflows/mission_control_decisions.json"
): Promise<DecisionImportResult[]> {
  const decisions = await readDecisions(decisionsPath);
  const artifacts = await artifactIndex();
  const results: DecisionImportResult[] = [];

  for (const decision of decisions) {
    const match = artifacts.get(decision.artifact_id);
    if (!match) {
      results.push({
        artifact_id: decision.artifact_id,
        decision: decision.decision,
        matched: false,
        message: "No local artifact matched this artifact_id."
      });
      continue;
    }

    const previousStatus = match.artifact.status;
    const newStatus = statusForDecision(decision.decision);
    const updated: ArtifactContract = {
      ...match.artifact,
      status: newStatus,
      next_action: nextActionForDecision(decision),
      requires_major_review:
        decision.decision === "approved" || decision.decision === "publish_requested"
          ? match.artifact.requires_major_review
          : true,
      publish_mode:
        decision.decision === "publish_requested"
          ? "review"
          : decision.decision === "rejected"
            ? "block"
            : match.artifact.publish_mode
    };

    let dryRunReport: string | undefined;
    if (decision.decision === "publish_requested") {
      dryRunReport = await publishDryRun({ file: match.artifact.github_path });
    }

    await writeArtifact(match.filePath, updated);
    results.push({
      artifact_id: decision.artifact_id,
      title: updated.title,
      decision: decision.decision,
      previous_status: previousStatus,
      new_status: updated.status,
      artifact_path: match.filePath,
      dry_run_report: dryRunReport,
      matched: true,
      message:
        decision.decision === "publish_requested"
          ? "Status updated and dry-run publish report generated. No live publishing attempted."
          : "Status updated locally from Mission Control decision."
    });
  }

  await writeDecisionImportOutputs(results);
  return results;
}

async function writeDecisionImportOutputs(results: DecisionImportResult[]): Promise<void> {
  const summary = {
    generated_at: timestamp(),
    decisions_processed: results.length,
    matched: results.filter((result) => result.matched).length,
    unmatched: results.filter((result) => !result.matched).length,
    publish_requested: results.filter((result) => result.decision === "publish_requested").length,
    dry_run_reports: results.filter((result) => result.dry_run_report).length,
    live_publish_attempted: false,
    results
  };

  await writeText(
    "content/logs/workflows/decision_import_summary.json",
    `${JSON.stringify(summary, null, 2)}\n`
  );

  const markdown = `# Mission Control Decision Import

Generated: ${summary.generated_at}

## Summary

- Decisions processed: ${summary.decisions_processed}
- Matched artifacts: ${summary.matched}
- Unmatched artifacts: ${summary.unmatched}
- Publish requested: ${summary.publish_requested}
- Dry-run reports generated: ${summary.dry_run_reports}
- Live publish attempted: no

## Results

${
  results.length
    ? results
        .map(
          (result) => `### ${result.artifact_id}

- Decision: ${result.decision}
- Matched: ${result.matched ? "yes" : "no"}
- Title: ${result.title ?? "unknown"}
- Previous status: ${result.previous_status ?? "unknown"}
- New status: ${result.new_status ?? "unchanged"}
- Artifact path: ${result.artifact_path ?? "not found"}
- Dry-run report: ${result.dry_run_report ?? "not generated"}
- Message: ${result.message}`
        )
        .join("\n\n")
    : "- No decisions found."
}

## Safety

- No live publishing was attempted.
- Mission Control remains the authority.
- Substack Engine only updated local artifact state and dry-run reports.
`;

  await writeText("content/logs/workflows/mission_control_decision_import.md", markdown);
}
