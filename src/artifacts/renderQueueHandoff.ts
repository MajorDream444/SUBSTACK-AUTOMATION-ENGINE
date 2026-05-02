import path from "node:path";
import { z } from "zod";
import { fileExists, readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

const ASSET_WORKFLOW_STATE_PATH = "content/logs/workflows/asset_workflow_state.json";
const RENDER_QUEUE_HANDOFF_PATH = "content/logs/workflows/render_queue_handoff.json";
const RENDER_QUEUE_HANDOFF_MD_PATH = "content/logs/workflows/render_queue_handoff.md";
const RENDER_QUEUE_SUMMARY_PATH = "content/logs/workflows/render_queue_handoff_summary.json";

const REQUIRED_ASSET_FILES = {
  video_script_path: "video_script.md",
  voice_script_path: "voice_script.txt",
  hooks_path: "hooks.json",
  visual_prompts_path: "visual_prompts.json",
  distribution_plan_path: "distribution_plan.json"
} as const;

const WorkflowArtifactSchema = z.object({
  artifact_id: z.string().uuid(),
  mission_id: z.string().optional().default(""),
  title: z.string().optional().default(""),
  lane: z.string().optional().default(""),
  asset_state: z.string().optional().default(""),
  current_status: z.enum([
    "held",
    "under_review",
    "needs_asset_rewrite",
    "render_queue_candidate",
    "publish_queue_candidate",
    "blocked"
  ]),
  current_decision: z.string().optional().default(""),
  current_asset_decision_id: z.string().optional().default(""),
  decided_at: z.string().optional().default("")
});

const AssetWorkflowStateSchema = z.object({
  artifacts: z.array(WorkflowArtifactSchema)
}).passthrough();

const RenderQueueItemSchema = z.object({
  render_queue_id: z.string(),
  artifact_id: z.string().uuid(),
  created_at: z.string()
}).passthrough();

const ExistingRenderQueueSchema = z.object({
  queue_items: z.array(RenderQueueItemSchema).optional().default([])
}).passthrough();

type WorkflowArtifact = z.infer<typeof WorkflowArtifactSchema>;
type RecommendedRenderer = "remotion" | "heygen" | "manual_review";

type RenderQueueItem = {
  render_queue_id: string;
  artifact_id: string;
  mission_id: string;
  title: string;
  lane: string;
  asset_state: string;
  asset_workflow_status: "render_queue_candidate";
  source_asset_folder: string;
  video_script_path: string;
  voice_script_path: string;
  hooks_path: string;
  visual_prompts_path: string;
  distribution_plan_path: string;
  recommended_renderer: RecommendedRenderer;
  render_status: "queued_dry_run";
  execution_mode: "local_only";
  created_at: string;
};

type SkippedRenderCandidate = {
  artifact_id: string;
  mission_id: string;
  title: string;
  lane: string;
  asset_state: string;
  asset_workflow_status: string;
  recommended_renderer: RecommendedRenderer;
  blocked_reason: string;
};

type RenderQueueExport = {
  generated_at: string;
  source: "SUBSTACK_ENGINE";
  source_state_path: string;
  total_workflow_artifacts: number;
  render_queue_candidates: number;
  queued: number;
  skipped: number;
  excluded: Record<string, number>;
  live_publish_attempted: false;
  render_attempted: false;
  external_api_calls: false;
  queue_items: RenderQueueItem[];
  skipped_candidates: SkippedRenderCandidate[];
};

function renderQueueId(artifactId: string): string {
  return `RQ-${artifactId}`;
}

function assetPaths(artifactId: string): Omit<
  RenderQueueItem,
  | "render_queue_id"
  | "artifact_id"
  | "mission_id"
  | "title"
  | "lane"
  | "asset_state"
  | "asset_workflow_status"
  | "recommended_renderer"
  | "render_status"
  | "execution_mode"
  | "created_at"
> {
  const sourceAssetFolder = path.join("content", "assets", artifactId);
  return {
    source_asset_folder: sourceAssetFolder,
    video_script_path: path.join(sourceAssetFolder, REQUIRED_ASSET_FILES.video_script_path),
    voice_script_path: path.join(sourceAssetFolder, REQUIRED_ASSET_FILES.voice_script_path),
    hooks_path: path.join(sourceAssetFolder, REQUIRED_ASSET_FILES.hooks_path),
    visual_prompts_path: path.join(sourceAssetFolder, REQUIRED_ASSET_FILES.visual_prompts_path),
    distribution_plan_path: path.join(sourceAssetFolder, REQUIRED_ASSET_FILES.distribution_plan_path)
  };
}

async function missingRequiredFiles(artifactId: string): Promise<string[]> {
  const paths = assetPaths(artifactId);
  const checks = await Promise.all(
    Object.entries(paths)
      .filter(([key]) => key !== "source_asset_folder")
      .map(async ([, filePath]) => ({
      filePath,
      exists: await fileExists(filePath)
    }))
  );

  return checks.filter((check) => !check.exists).map((check) => check.filePath);
}

function isHighRiskLane(lane: string): boolean {
  return /\b(SAF|geopolitics|finance|legal|jamaica oil|diaspora strategy)\b/i.test(lane);
}

function recommendedRenderer(artifact: WorkflowArtifact, hasMissingFiles: boolean): RecommendedRenderer {
  if (artifact.current_status === "blocked" || hasMissingFiles || isHighRiskLane(artifact.lane)) {
    return "manual_review";
  }

  if (artifact.lane === "Reaction Doctrine") return "remotion";
  if (artifact.lane === "Doctrine" || artifact.lane === "Major AI OS") return "heygen";
  return "manual_review";
}

async function readWorkflowState(): Promise<WorkflowArtifact[]> {
  if (!(await fileExists(ASSET_WORKFLOW_STATE_PATH))) {
    throw new Error(`Asset workflow state not found: ${ASSET_WORKFLOW_STATE_PATH}`);
  }

  const parsed = AssetWorkflowStateSchema.parse(JSON.parse(await readText(ASSET_WORKFLOW_STATE_PATH)));
  return parsed.artifacts;
}

async function readExistingQueueItems(): Promise<Map<string, z.infer<typeof RenderQueueItemSchema>>> {
  if (!(await fileExists(RENDER_QUEUE_HANDOFF_PATH))) return new Map();

  const parsed = ExistingRenderQueueSchema.parse(JSON.parse(await readText(RENDER_QUEUE_HANDOFF_PATH)));
  return new Map(parsed.queue_items.map((item) => [item.artifact_id, item]));
}

function countByStatus(artifacts: WorkflowArtifact[]): Record<string, number> {
  return artifacts.reduce<Record<string, number>>((counts, artifact) => {
    counts[artifact.current_status] = (counts[artifact.current_status] ?? 0) + 1;
    return counts;
  }, {});
}

function markdown(exportPayload: RenderQueueExport): string {
  return `# Render Queue Handoff

Generated: ${exportPayload.generated_at}

## Summary

- Source state: ${exportPayload.source_state_path}
- Workflow artifacts: ${exportPayload.total_workflow_artifacts}
- Render queue candidates: ${exportPayload.render_queue_candidates}
- Queued dry-run items: ${exportPayload.queued}
- Skipped candidates: ${exportPayload.skipped}
- Live publish attempted: no
- Render attempted: no
- External API calls: no

## Queue Items

${
  exportPayload.queue_items
    .map(
      (item) => `### ${item.title || item.artifact_id}

- Render queue ID: ${item.render_queue_id}
- Artifact ID: ${item.artifact_id}
- Mission ID: ${item.mission_id || "unknown"}
- Lane: ${item.lane || "unknown"}
- Asset state: ${item.asset_state || "unknown"}
- Renderer: ${item.recommended_renderer}
- Render status: ${item.render_status}
- Source asset folder: ${item.source_asset_folder}
- Video script: ${item.video_script_path}
- Voice script: ${item.voice_script_path}
- Hooks: ${item.hooks_path}
- Visual prompts: ${item.visual_prompts_path}
- Distribution plan: ${item.distribution_plan_path}`
    )
    .join("\n\n") || "- No render queue candidates are ready."
}

## Skipped Candidates

${
  exportPayload.skipped_candidates
    .map(
      (item) => `### ${item.title || item.artifact_id}

- Artifact ID: ${item.artifact_id}
- Lane: ${item.lane || "unknown"}
- Asset workflow status: ${item.asset_workflow_status}
- Recommended renderer: ${item.recommended_renderer}
- Blocked reason: ${item.blocked_reason}`
    )
    .join("\n\n") || "- No render candidates were skipped."
}

## Excluded Statuses

${Object.entries(exportPayload.excluded).map(([status, count]) => `- ${status}: ${count}`).join("\n") || "- none"}

## Safety

- Local queue manifest only.
- No rendering.
- No browser automation.
- No live publishing.
- No external API calls.
- Mission Control remains the authority.
`;
}

export async function exportRenderQueueHandoff(): Promise<RenderQueueExport> {
  const workflowArtifacts = await readWorkflowState();
  const existingItems = await readExistingQueueItems();
  const candidates = workflowArtifacts.filter((artifact) => artifact.current_status === "render_queue_candidate");
  const queueItems: RenderQueueItem[] = [];
  const skippedCandidates: SkippedRenderCandidate[] = [];

  for (const artifact of candidates) {
    const missingFiles = await missingRequiredFiles(artifact.artifact_id);
    const renderer = recommendedRenderer(artifact, missingFiles.length > 0);

    if (missingFiles.length > 0) {
      skippedCandidates.push({
        artifact_id: artifact.artifact_id,
        mission_id: artifact.mission_id,
        title: artifact.title,
        lane: artifact.lane,
        asset_state: artifact.asset_state,
        asset_workflow_status: artifact.current_status,
        recommended_renderer: renderer,
        blocked_reason: `Missing required asset files: ${missingFiles.join(", ")}`
      });
      continue;
    }

    const existing = existingItems.get(artifact.artifact_id);
    queueItems.push({
      render_queue_id: existing?.render_queue_id ?? renderQueueId(artifact.artifact_id),
      artifact_id: artifact.artifact_id,
      mission_id: artifact.mission_id,
      title: artifact.title,
      lane: artifact.lane,
      asset_state: artifact.asset_state,
      asset_workflow_status: "render_queue_candidate",
      ...assetPaths(artifact.artifact_id),
      recommended_renderer: renderer,
      render_status: "queued_dry_run",
      execution_mode: "local_only",
      created_at: existing?.created_at ?? timestamp()
    });
  }

  const excluded = countByStatus(
    workflowArtifacts.filter((artifact) => artifact.current_status !== "render_queue_candidate")
  );
  const exportPayload: RenderQueueExport = {
    generated_at: timestamp(),
    source: "SUBSTACK_ENGINE",
    source_state_path: ASSET_WORKFLOW_STATE_PATH,
    total_workflow_artifacts: workflowArtifacts.length,
    render_queue_candidates: candidates.length,
    queued: queueItems.length,
    skipped: skippedCandidates.length,
    excluded,
    live_publish_attempted: false,
    render_attempted: false,
    external_api_calls: false,
    queue_items: queueItems.sort((a, b) => a.title.localeCompare(b.title)),
    skipped_candidates: skippedCandidates.sort((a, b) => a.title.localeCompare(b.title))
  };

  const summary = {
    generated_at: exportPayload.generated_at,
    source_state_path: exportPayload.source_state_path,
    total_workflow_artifacts: exportPayload.total_workflow_artifacts,
    render_queue_candidates: exportPayload.render_queue_candidates,
    queued: exportPayload.queued,
    skipped: exportPayload.skipped,
    excluded: exportPayload.excluded,
    live_publish_attempted: false,
    render_attempted: false,
    external_api_calls: false
  };

  await writeText(RENDER_QUEUE_HANDOFF_PATH, `${JSON.stringify(exportPayload, null, 2)}\n`);
  await writeText(RENDER_QUEUE_HANDOFF_MD_PATH, markdown(exportPayload));
  await writeText(RENDER_QUEUE_SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`);

  return exportPayload;
}
