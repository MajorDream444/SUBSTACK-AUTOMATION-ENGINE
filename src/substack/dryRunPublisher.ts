import matter from "gray-matter";
import { z } from "zod";
import { isValidLane } from "../content/lanes.js";
import { readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";
import { scoreArtifact } from "../artifacts/scoring.js";

const PublishInput = z.object({
  file: z.string().min(1)
});

const REACTION_DOCTRINE_SECTIONS = [
  "Source URL",
  "Source Title",
  "Source Transcript or Summary",
  "What They Said",
  "What They Missed",
  "The System Underneath",
  "Why It Matters",
  "3–5 Minute Video Script",
  "Substack Article Version",
  "Reaction Hook Set",
  "Reaction Distribution Plan",
  "Fact-Check Notes",
  "Risk Notes",
  "Reaction System Mapping"
];

function missingSections(markdown: string, headings: string[]): string[] {
  return headings.filter((heading) => !markdown.includes(`## ${heading}`));
}

export async function publishDryRun(input: z.infer<typeof PublishInput>): Promise<string> {
  const parsed = PublishInput.parse(input);
  const markdown = await readText(parsed.file);
  const packet = matter(markdown);
  const title = String(packet.data.title ?? "").trim();
  const slug = String(packet.data.slug ?? "").trim();
  const status = String(packet.data.status ?? "").trim().toLowerCase();
  const lane = String(packet.data.lane ?? "").trim();
  const errors: string[] = [];

  if (!title) errors.push("Missing title.");
  if (!slug) errors.push("Missing slug.");
  if (!lane || !isValidLane(lane)) errors.push(`Missing or invalid lane: ${lane || "missing"}.`);
  if (status === "blocked") errors.push("Status is blocked.");
  const reactionMissingSections =
    lane === "Reaction Doctrine" ? missingSections(markdown, REACTION_DOCTRINE_SECTIONS) : [];
  if (reactionMissingSections.length > 0) {
    errors.push(`Reaction Doctrine packet missing sections: ${reactionMissingSections.join(", ")}`);
  }
  const reactionScore = lane === "Reaction Doctrine" ? scoreArtifact({ title, lane, markdown }) : undefined;
  if (reactionScore?.systemUnderneathWeak) {
    errors.push("Reaction Doctrine system-underneath section is missing or weak.");
  }

  const report = [
    "# Substack Dry-Run Report",
    "",
    `Generated: ${timestamp()}`,
    `File: ${parsed.file}`,
    `Title: ${title || "missing"}`,
    `Slug: ${slug || "missing"}`,
    `Lane: ${lane || "missing"}`,
    `Status: ${status || "missing"}`,
    `Publish mode: dry-run only`,
    "",
    "## Result",
    errors.length === 0 ? "- Ready for future dry-run publish flow." : "- Not ready to publish.",
    lane === "Reaction Doctrine"
      ? "- Reaction Doctrine: publish only the tightened Substack Article Version, not the preserved raw rant/source."
      : "",
    lane === "Reaction Doctrine" ? "" : "",
    lane === "Reaction Doctrine" ? "## Reaction Doctrine Dry-Run" : "",
    lane === "Reaction Doctrine"
      ? reactionMissingSections.length === 0
        ? "- Required Reaction Doctrine sections are present."
        : `- Missing sections: ${reactionMissingSections.join(", ")}`
      : "",
    lane === "Reaction Doctrine"
      ? reactionScore?.systemUnderneathWeak
        ? "- System underneath is weak; artifact governance will block this packet."
        : "- System underneath is present."
      : "",
    lane === "Reaction Doctrine" ? "- Live posting remains disabled." : "",
    "",
    "## Errors",
    ...(errors.length ? errors.map((error) => `- ${error}`) : ["- None"]),
    "",
    "## Safety",
    "- No live publishing was attempted.",
    "- Substack credentials were not read or logged."
  ].join("\n");

  const outputPath = "content/logs/workflows/substack_dry_run_report.md";
  await writeText(outputPath, `${report}\n`);
  return outputPath;
}
