import crypto from "node:crypto";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { createSlug } from "../content/slug.js";
import { readText, writeText } from "../utils/fs.js";
import { applyRiskGovernance, type ArtifactStatus } from "./riskGovernance.js";
import { scoreArtifact } from "./scoring.js";

export const ArtifactContractSchema = z.object({
  artifact_id: z.string().uuid(),
  mission_id: z.string(),
  artifact_type: z.enum(["substack_packet", "reaction_packet", "video_script", "publish_report", "daily_content_brief"]),
  source: z.literal("SUBSTACK_ENGINE"),
  status: z.enum(["draft", "ready", "needs_review", "scheduled", "published", "blocked"]),
  lane: z.enum(["BWYH", "Contour", "SAF", "Major AI OS", "Doctrine", "Reaction Doctrine"]),
  title: z.string(),
  source_url: z.string(),
  github_path: z.string(),
  airtable_record_id: z.string(),
  notion_page_id: z.string(),
  requires_major_review: z.boolean(),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  risk_level: z.enum(["low", "medium", "high"]),
  publish_mode: z.enum(["auto", "review", "block", "delay"]),
  next_action: z.string()
});

export type ArtifactContract = z.infer<typeof ArtifactContractSchema>;

export type ArtifactType = ArtifactContract["artifact_type"];

export function missionIdFromDate(date = new Date()): string {
  const day = date.toISOString().slice(5, 10).replace("-", "");
  return `M-${day}`;
}

export function contractLane(lane: string): ArtifactContract["lane"] {
  switch (lane) {
    case "BWYH trust-building":
      return "BWYH";
    case "Contour authority / sales":
      return "Contour";
    case "SAF narrative / research":
      return "SAF";
    case "Major AI OS productization":
      return "Major AI OS";
    case "Personal doctrine / 10 Pillars":
      return "Doctrine";
    case "Reaction Doctrine":
      return "Reaction Doctrine";
    default:
      return "Major AI OS";
  }
}

function baseStatus(status: string): ArtifactStatus {
  const normalized = status.toLowerCase();
  if (normalized === "blocked") return "blocked";
  if (normalized === "scheduled") return "scheduled";
  if (normalized === "published") return "published";
  if (normalized === "ready") return "ready";
  if (normalized === "needs_review") return "needs_review";
  return "draft";
}

export async function writeArtifactForMarkdown(input: {
  markdownPath: string;
  artifactType?: ArtifactType;
  airtableRecordId?: string;
  notionPageId?: string;
  missionId?: string;
  sourceUrl?: string;
}): Promise<string> {
  const markdown = await readText(input.markdownPath);
  const parsed = matter(markdown);
  const title = String(parsed.data.title ?? path.basename(input.markdownPath, path.extname(input.markdownPath)));
  const slug = String(parsed.data.slug ?? createSlug(title));
  const lane = String(parsed.data.lane ?? "Major AI OS productization");
  const status = String(parsed.data.status ?? "draft");
  const sourceUrl = input.sourceUrl ?? String(parsed.data.source_url ?? parsed.data.sourceUrl ?? "");
  const score = scoreArtifact({ title, lane, markdown });
  const governance = applyRiskGovernance({
    lane,
    title,
    markdown,
    baseStatus: baseStatus(status),
    score
  });
  const artifactId = crypto.randomUUID();
  const artifact: ArtifactContract = ArtifactContractSchema.parse({
    artifact_id: artifactId,
    mission_id: input.missionId ?? missionIdFromDate(),
    artifact_type: input.artifactType ?? (lane === "Reaction Doctrine" ? "reaction_packet" : "substack_packet"),
    source: "SUBSTACK_ENGINE",
    status: governance.status,
    lane: contractLane(lane),
    title,
    source_url: sourceUrl,
    github_path: input.markdownPath,
    airtable_record_id: input.airtableRecordId ?? "",
    notion_page_id: input.notionPageId ?? "",
    requires_major_review: governance.requiresMajorReview,
    score: score.total,
    confidence: score.confidence,
    risk_level: governance.riskLevel,
    publish_mode: governance.publishMode,
    next_action: governance.nextAction
  });

  const outputPath = path.join("content", "logs", "agents", "artifacts", `${artifactId}-${slug}.json`);
  await writeText(outputPath, `${JSON.stringify(artifact, null, 2)}\n`);
  return outputPath;
}

export async function readArtifact(filePath: string): Promise<ArtifactContract> {
  return ArtifactContractSchema.parse(JSON.parse(await readText(filePath)));
}
