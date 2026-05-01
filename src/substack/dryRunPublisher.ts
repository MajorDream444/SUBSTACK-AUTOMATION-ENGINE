import matter from "gray-matter";
import { z } from "zod";
import { isValidLane } from "../content/lanes.js";
import { readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

const PublishInput = z.object({
  file: z.string().min(1)
});

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
