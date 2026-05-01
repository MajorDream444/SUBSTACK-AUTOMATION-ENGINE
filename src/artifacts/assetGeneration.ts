import path from "node:path";
import { readArtifact, type ArtifactContract } from "./artifactContract.js";
import { extractSection } from "./scoring.js";
import { listFiles, readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

type AssetState = "prepared" | "ready_for_distribution";

type AssetGenerationResult = {
  artifact_id: string;
  mission_id: string;
  title: string;
  lane: string;
  status: ArtifactContract["status"];
  asset_state?: AssetState;
  generated_files: string[];
  skipped: boolean;
  blocked_reason?: string;
};

const ELIGIBLE_STATUS: Record<string, AssetState | undefined> = {
  ready: "prepared",
  scheduled_dry_run: "ready_for_distribution"
};

function isWeak(value: string): boolean {
  const text = value.trim().toLowerCase();
  return text.length < 40 || text.includes("todo") || text.includes("missing") || text.includes("name the system");
}

async function readArtifacts(): Promise<Array<{ filePath: string; artifact: ArtifactContract }>> {
  const dir = "content/logs/agents/artifacts";
  const files = (await listFiles(dir)).filter((file) => file.endsWith(".json"));
  const artifacts = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    artifacts.push({ filePath, artifact: await readArtifact(filePath) });
  }

  return artifacts;
}

function baseMeta(artifact: ArtifactContract, assetState: AssetState) {
  return {
    artifact_id: artifact.artifact_id,
    mission_id: artifact.mission_id,
    title: artifact.title,
    lane: artifact.lane,
    source_artifact_path: artifact.github_path,
    generated_at: timestamp(),
    asset_state: assetState
  };
}

function publicThesis(markdown: string, artifact: ArtifactContract): string {
  const candidates = [
    extractSection(markdown, "Substack Article Version"),
    extractSection(markdown, "Polished Editorial Edit"),
    extractSection(markdown, "Why It Matters"),
    extractSection(markdown, "The System Underneath"),
    extractSection(markdown, "Core Idea")
  ];
  const usable = candidates.find((candidate) => {
    const text = candidate.trim().toLowerCase();
    return candidate.trim().length > 0 && !text.includes("todo");
  });

  return (usable || `${artifact.title} needs a tightened public version.`).trim();
}

function systemUnderneath(markdown: string): string {
  return extractSection(markdown, "The System Underneath").trim();
}

function videoScript(artifact: ArtifactContract, markdown: string, assetState: AssetState): string {
  const thesis = publicThesis(markdown, artifact);
  const system = systemUnderneath(markdown);
  const reactionSystem = artifact.lane === "Reaction Doctrine" ? `\n\nThe system underneath:\n${system}\n` : "";

  return `# ${artifact.title} — 3–5 Minute Script

Artifact ID: ${artifact.artifact_id}
Mission ID: ${artifact.mission_id}
Lane: ${artifact.lane}
Asset state: ${assetState}
Generated: ${timestamp()}

## Strong Opening Hook

Most people are reacting to the surface. The leverage is underneath it.

## Clear Thesis

${thesis}
${reactionSystem}
## Simple Breakdown

1. Name the moment without getting trapped inside the noise.
2. Pull out the system underneath the moment.
3. Show why it matters for Major AI OS, culture, doctrine, diaspora, media, or leverage.
4. Give the audience a cleaner way to read what is happening.

## Close

If this resonates, stay close. Because here, systems are what we build.
`;
}

function voiceScript(artifact: ArtifactContract, markdown: string): string {
  const thesis = publicThesis(markdown, artifact).replace(/\n+/g, "\n\n");
  const system = artifact.lane === "Reaction Doctrine" ? systemUnderneath(markdown) : "";

  return `Most people are reacting to the surface.

[pause]

The leverage is underneath it.

[beat]

${thesis}

[pause]

${system ? `The system underneath is this: ${system}\n\n[beat]\n\n` : ""}This is not about watering the idea down.

It is about tightening it until the signal can travel.

[pause]

If this resonates, stay close. Because here, systems are what we build.
`;
}

function hooks(artifact: ArtifactContract) {
  const base = {
    artifact_id: artifact.artifact_id,
    mission_id: artifact.mission_id,
    title: artifact.title,
    lane: artifact.lane,
    source_artifact_path: artifact.github_path,
    generated_at: timestamp()
  };
  const angles = [
    "system underneath",
    "culture signal",
    "doctrine",
    "media leverage",
    "diaspora reading",
    "builder lens",
    "public signal",
    "hidden incentive",
    "platform logic",
    "Major AI OS"
  ];

  return {
    ...base,
    hooks: angles.map((angle, index) => ({
      hook_id: `H-${String(index + 1).padStart(2, "0")}`,
      platform: ["x", "instagram", "youtube", "substack", "fanbase"][index % 5],
      hook_text:
        index === 0
          ? "They saw the moment. They missed the system underneath."
          : `${artifact.title}: read it through ${angle}, not noise.`,
      angle,
      risk_level: artifact.risk_level
    }))
  };
}

function visualPrompts(artifact: ArtifactContract, assetState: AssetState) {
  const meta = baseMeta(artifact, assetState);
  return {
    ...meta,
    scenes: [
      {
        scene_id: "S-01",
        duration_seconds: 12,
        visual_prompt: "Direct opening frame, clean title treatment, high contrast editorial style.",
        on_screen_text: artifact.title,
        tool_target: "remotion"
      },
      {
        scene_id: "S-02",
        duration_seconds: 35,
        visual_prompt: "Slow paced narration frame with caption-led emphasis and subtle motion.",
        on_screen_text: "Read the system underneath.",
        tool_target: "heygen"
      },
      {
        scene_id: "S-03",
        duration_seconds: 45,
        visual_prompt: "Diagrammatic breakdown of surface moment to system layer to leverage.",
        on_screen_text: "Surface → System → Leverage",
        tool_target: "remotion"
      },
      {
        scene_id: "S-04",
        duration_seconds: 20,
        visual_prompt: "Closing CTA frame with restrained motion and clean typography.",
        on_screen_text: "Here, systems are what we build.",
        tool_target: "general"
      }
    ]
  };
}

function distributionPlan(artifact: ArtifactContract, assetState: AssetState) {
  const meta = baseMeta(artifact, assetState);
  const caption = `${artifact.title} — tightened into a system-level signal.`;
  return {
    ...meta,
    dry_run_only: true,
    substack: {
      status: "draft_only",
      suggested_caption: caption,
      asset_dependency: "video_script.md"
    },
    instagram: {
      status: "draft_only",
      suggested_caption: "They saw the moment. We are reading the system.",
      asset_dependency: "hooks.json"
    },
    youtube: {
      status: "draft_only",
      suggested_caption: caption,
      asset_dependency: "video_script.md"
    },
    x: {
      status: "draft_only",
      suggested_caption: "The real story is the system underneath.",
      asset_dependency: "hooks.json"
    },
    fanbase: {
      status: "draft_only",
      suggested_caption: "A doctrine note from the system layer.",
      asset_dependency: "voice_script.txt"
    },
    notes: "Dry-run only. No platform posting or external API calls."
  };
}

async function generateForArtifact(artifact: ArtifactContract): Promise<AssetGenerationResult> {
  const assetState = ELIGIBLE_STATUS[artifact.status];
  if (!assetState) {
    return {
      artifact_id: artifact.artifact_id,
      mission_id: artifact.mission_id,
      title: artifact.title,
      lane: artifact.lane,
      status: artifact.status,
      generated_files: [],
      skipped: true,
      blocked_reason: `Status ${artifact.status} is not eligible for asset generation.`
    };
  }

  const markdown = await readText(artifact.github_path);
  const system = systemUnderneath(markdown);
  if (artifact.lane === "Reaction Doctrine" && isWeak(system)) {
    return {
      artifact_id: artifact.artifact_id,
      mission_id: artifact.mission_id,
      title: artifact.title,
      lane: artifact.lane,
      status: artifact.status,
      generated_files: [],
      skipped: true,
      blocked_reason: "Reaction Doctrine artifact lacks a strong system-underneath section."
    };
  }

  const dir = path.join("content", "assets", artifact.artifact_id);
  const files = {
    videoScript: path.join(dir, "video_script.md"),
    voiceScript: path.join(dir, "voice_script.txt"),
    hooks: path.join(dir, "hooks.json"),
    visualPrompts: path.join(dir, "visual_prompts.json"),
    distributionPlan: path.join(dir, "distribution_plan.json"),
    manifest: path.join(dir, "asset_manifest.json")
  };
  const generatedFiles = Object.values(files);

  await writeText(files.videoScript, videoScript(artifact, markdown, assetState));
  await writeText(files.voiceScript, voiceScript(artifact, markdown));
  await writeText(files.hooks, `${JSON.stringify({ ...baseMeta(artifact, assetState), asset_state: assetState, ...hooks(artifact) }, null, 2)}\n`);
  await writeText(files.visualPrompts, `${JSON.stringify(visualPrompts(artifact, assetState), null, 2)}\n`);
  await writeText(files.distributionPlan, `${JSON.stringify(distributionPlan(artifact, assetState), null, 2)}\n`);
  await writeText(
    files.manifest,
    `${JSON.stringify(
      {
        ...baseMeta(artifact, assetState),
        generated_files: generatedFiles,
        blocked_reason: ""
      },
      null,
      2
    )}\n`
  );

  return {
    artifact_id: artifact.artifact_id,
    mission_id: artifact.mission_id,
    title: artifact.title,
    lane: artifact.lane,
    status: artifact.status,
    asset_state: assetState,
    generated_files: generatedFiles,
    skipped: false
  };
}

export async function generateAssets(): Promise<AssetGenerationResult[]> {
  const artifactEntries = await readArtifacts();
  const results: AssetGenerationResult[] = [];

  for (const entry of artifactEntries) {
    results.push(await generateForArtifact(entry.artifact));
  }

  await writeAssetLogs(results);
  return results;
}

async function writeAssetLogs(results: AssetGenerationResult[]): Promise<void> {
  const summary = {
    generated_at: timestamp(),
    total_artifacts: results.length,
    generated: results.filter((result) => !result.skipped).length,
    skipped: results.filter((result) => result.skipped).length,
    prepared: results.filter((result) => result.asset_state === "prepared").length,
    ready_for_distribution: results.filter((result) => result.asset_state === "ready_for_distribution").length,
    live_publish_attempted: false,
    external_api_calls: false,
    results
  };

  await writeText("content/logs/workflows/asset_generation_summary.json", `${JSON.stringify(summary, null, 2)}\n`);
  await writeText("content/logs/workflows/asset_generation_log.json", `${JSON.stringify(results, null, 2)}\n`);

  const markdown = `# Asset Generation Log

Generated: ${summary.generated_at}

## Summary

- Total artifacts: ${summary.total_artifacts}
- Generated: ${summary.generated}
- Skipped: ${summary.skipped}
- Prepared: ${summary.prepared}
- Ready for distribution: ${summary.ready_for_distribution}
- Live publish attempted: no
- External API calls: no

## Results

${
  results
    .map(
      (result) => `### ${result.title}

- Artifact ID: ${result.artifact_id}
- Mission ID: ${result.mission_id}
- Lane: ${result.lane}
- Status: ${result.status}
- Asset state: ${result.asset_state ?? "none"}
- Skipped: ${result.skipped ? "yes" : "no"}
- Blocked reason: ${result.blocked_reason ?? "none"}
- Generated files: ${result.generated_files.length ? result.generated_files.join(", ") : "none"}`
    )
    .join("\n\n") || "- No artifacts found."
}

## Safety

- Dry-run asset generation only.
- No live publishing.
- No external API calls.
`;

  await writeText("content/logs/workflows/asset_generation_log.md", markdown);
}
