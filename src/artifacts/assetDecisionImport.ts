import { z } from "zod";
import { env } from "../config/env.js";
import { fileExists, readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

const LOCAL_COPY_PATH = "content/logs/workflows/mission_control_asset_queue_decisions.json";
const REPORT_PATH = "content/logs/workflows/mission_control_asset_queue_decisions.md";
const STATE_PATH = "content/logs/workflows/asset_workflow_state.json";
const SUMMARY_PATH = "content/logs/workflows/asset_queue_decision_import_summary.json";

const AssetQueueDecisionSchema = z.object({
  asset_decision_id: z.string().min(1),
  artifact_id: z.string().uuid(),
  mission_id: z.string().optional().default(""),
  title: z.string().optional().default(""),
  lane: z.string().optional().default(""),
  asset_state: z.string().optional().default(""),
  decision: z.enum([
    "hold",
    "review_assets",
    "request_asset_rewrite",
    "approve_for_render_queue",
    "approve_for_publish_queue_later",
    "block_asset"
  ]),
  decided_by: z.string().optional().default("Mission Control"),
  decided_at: z.string().optional().default(""),
  reason: z.string().optional().default(""),
  source: z.string().optional().default("MISSION_CONTROL"),
  execution_mode: z.string().optional().default("local_only")
});

const AssetQueueDecisionFileSchema = z.union([
  z.array(AssetQueueDecisionSchema),
  z.object({
    generated_at: z.string().optional(),
    mode: z.string().optional(),
    target_path: z.string().optional(),
    decisions: z.array(AssetQueueDecisionSchema)
  })
]);

const ExistingStateSchema = z.object({
  decisions: z.array(AssetQueueDecisionSchema).optional().default([])
}).passthrough();

export type AssetQueueDecision = z.infer<typeof AssetQueueDecisionSchema>;

type AssetWorkflowStatus =
  | "held"
  | "under_review"
  | "needs_asset_rewrite"
  | "render_queue_candidate"
  | "publish_queue_candidate"
  | "blocked";

type AssetWorkflowArtifactState = {
  artifact_id: string;
  mission_id: string;
  title: string;
  lane: string;
  asset_state: string;
  current_decision: AssetQueueDecision["decision"];
  current_status: AssetWorkflowStatus;
  current_asset_decision_id: string;
  decided_at: string;
  decided_by: string;
  reason: string;
  history: AssetQueueDecision[];
};

export type AssetQueueDecisionImportResult = {
  source_path: string;
  decisions_in_file: number;
  unique_decisions_total: number;
  new_decisions_imported: number;
  duplicates_ignored: number;
  artifacts_tracked: number;
  live_publish_attempted: false;
  render_attempted: false;
  external_api_calls: false;
  state_path: string;
  report_path: string;
  local_copy_path: string;
  summary_path: string;
  artifacts: AssetWorkflowArtifactState[];
};

function workflowStatusForDecision(decision: AssetQueueDecision["decision"]): AssetWorkflowStatus {
  switch (decision) {
    case "hold":
      return "held";
    case "review_assets":
      return "under_review";
    case "request_asset_rewrite":
      return "needs_asset_rewrite";
    case "approve_for_render_queue":
      return "render_queue_candidate";
    case "approve_for_publish_queue_later":
      return "publish_queue_candidate";
    case "block_asset":
      return "blocked";
  }
}

function extractDecisions(payload: unknown): AssetQueueDecision[] {
  const parsed = AssetQueueDecisionFileSchema.parse(payload);
  return Array.isArray(parsed) ? parsed : parsed.decisions;
}

async function readExistingDecisions(): Promise<AssetQueueDecision[]> {
  if (!(await fileExists(STATE_PATH))) return [];

  const rawState = JSON.parse(await readText(STATE_PATH));
  return ExistingStateSchema.parse(rawState).decisions;
}

function decisionTime(decision: AssetQueueDecision, fallbackIndex: number): number {
  const value = decision.decided_at ? Date.parse(decision.decided_at) : Number.NaN;
  return Number.isFinite(value) ? value : fallbackIndex;
}

function latestDecision(decisions: AssetQueueDecision[]): AssetQueueDecision {
  return decisions
    .map((decision, index) => ({ decision, index }))
    .sort((a, b) => decisionTime(b.decision, b.index) - decisionTime(a.decision, a.index))[0].decision;
}

function artifactStates(decisions: AssetQueueDecision[]): AssetWorkflowArtifactState[] {
  const grouped = new Map<string, AssetQueueDecision[]>();

  for (const decision of decisions) {
    const history = grouped.get(decision.artifact_id) ?? [];
    history.push(decision);
    grouped.set(decision.artifact_id, history);
  }

  return Array.from(grouped.values())
    .map((history) => {
      const current = latestDecision(history);
      return {
        artifact_id: current.artifact_id,
        mission_id: current.mission_id,
        title: current.title,
        lane: current.lane,
        asset_state: current.asset_state,
        current_decision: current.decision,
        current_status: workflowStatusForDecision(current.decision),
        current_asset_decision_id: current.asset_decision_id,
        decided_at: current.decided_at,
        decided_by: current.decided_by,
        reason: current.reason,
        history: history.sort((a, b) => decisionTime(a, 0) - decisionTime(b, 0))
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function countBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const value = String(item[key] ?? "unknown");
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function markdownReport(result: AssetQueueDecisionImportResult): string {
  return `# Mission Control Asset Queue Decisions

Generated: ${timestamp()}

## Summary

- Source path: ${result.source_path}
- Decisions in file: ${result.decisions_in_file}
- New decisions imported: ${result.new_decisions_imported}
- Duplicates ignored: ${result.duplicates_ignored}
- Unique decisions total: ${result.unique_decisions_total}
- Artifacts tracked: ${result.artifacts_tracked}
- Live publish attempted: no
- Render attempted: no
- External API calls: no

## Current Asset Workflow State

${
  result.artifacts
    .map(
      (artifact) => `### ${artifact.title || artifact.artifact_id}

- Artifact ID: ${artifact.artifact_id}
- Mission ID: ${artifact.mission_id || "unknown"}
- Lane: ${artifact.lane || "unknown"}
- Asset state: ${artifact.asset_state || "unknown"}
- Current decision: ${artifact.current_decision}
- Asset workflow status: ${artifact.current_status}
- Current asset decision ID: ${artifact.current_asset_decision_id}
- Decided at: ${artifact.decided_at || "unknown"}
- Reason: ${artifact.reason || "none"}
- History count: ${artifact.history.length}`
    )
    .join("\n\n") || "- No asset decisions imported."
}

## Safety

- This importer updates workflow state and logs only.
- Generated asset files are not mutated.
- No live publishing, rendering, or external API calls were attempted.
- Mission Control remains the authority.
`;
}

export async function importAssetQueueDecisions(inputPath = env.missionControlAssetDecisionsPath): Promise<AssetQueueDecisionImportResult> {
  if (!inputPath) {
    throw new Error("MISSION_CONTROL_ASSET_DECISIONS_PATH is required unless --file is provided.");
  }

  if (!(await fileExists(inputPath))) {
    throw new Error(`Mission Control asset queue decisions file not found: ${inputPath}`);
  }

  const rawInput = await readText(inputPath);
  const parsedInput: unknown = JSON.parse(rawInput);
  const incomingDecisions = extractDecisions(parsedInput);
  const existingDecisions = await readExistingDecisions();
  const seenDecisionIds = new Set(existingDecisions.map((decision) => decision.asset_decision_id));
  const mergedDecisions = [...existingDecisions];
  let duplicatesIgnored = 0;
  let newDecisionsImported = 0;

  for (const decision of incomingDecisions) {
    if (seenDecisionIds.has(decision.asset_decision_id)) {
      duplicatesIgnored += 1;
      continue;
    }

    seenDecisionIds.add(decision.asset_decision_id);
    mergedDecisions.push(decision);
    newDecisionsImported += 1;
  }

  const artifacts = artifactStates(mergedDecisions);
  const result: AssetQueueDecisionImportResult = {
    source_path: inputPath,
    decisions_in_file: incomingDecisions.length,
    unique_decisions_total: mergedDecisions.length,
    new_decisions_imported: newDecisionsImported,
    duplicates_ignored: duplicatesIgnored,
    artifacts_tracked: artifacts.length,
    live_publish_attempted: false,
    render_attempted: false,
    external_api_calls: false,
    state_path: STATE_PATH,
    report_path: REPORT_PATH,
    local_copy_path: LOCAL_COPY_PATH,
    summary_path: SUMMARY_PATH,
    artifacts
  };

  const state = {
    generated_at: timestamp(),
    source: "MISSION_CONTROL",
    source_path: inputPath,
    total_unique_decisions: mergedDecisions.length,
    decisions: mergedDecisions,
    by_decision: countBy(mergedDecisions, "decision"),
    by_asset_workflow_status: countBy(artifacts, "current_status"),
    artifacts,
    live_publish_attempted: false,
    render_attempted: false,
    external_api_calls: false
  };

  const summary = {
    generated_at: timestamp(),
    source: "MISSION_CONTROL",
    source_path: inputPath,
    decisions_in_file: incomingDecisions.length,
    new_decisions_imported: newDecisionsImported,
    duplicates_ignored: duplicatesIgnored,
    unique_decisions_total: mergedDecisions.length,
    artifacts_tracked: artifacts.length,
    by_decision: countBy(mergedDecisions, "decision"),
    by_asset_workflow_status: countBy(artifacts, "current_status"),
    live_publish_attempted: false,
    render_attempted: false,
    external_api_calls: false
  };

  await writeText(LOCAL_COPY_PATH, rawInput.endsWith("\n") ? rawInput : `${rawInput}\n`);
  await writeText(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
  await writeText(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);
  await writeText(REPORT_PATH, markdownReport(result));

  return result;
}
