import path from "node:path";
import { z } from "zod";
import { isValidLane } from "./lanes.js";
import { createSlug } from "./slug.js";
import { readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

const GenerateArticlePacketInput = z.object({
  file: z.string().min(1),
  title: z.string().optional(),
  lane: z.string().optional()
});

export type GenerateArticlePacketInput = z.infer<typeof GenerateArticlePacketInput>;

function titleFromFile(filePath: string): string {
  return path
    .basename(filePath, path.extname(filePath))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstSentence(raw: string): string {
  return raw.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/)?.[0]?.trim() ?? raw.trim();
}

function firstParagraph(raw: string): string {
  return raw.split(/\n\s*\n/)[0]?.trim() ?? raw.trim();
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{{${key}}}`, value),
    template
  );
}

export async function generateArticlePacket(input: GenerateArticlePacketInput): Promise<string> {
  const parsed = GenerateArticlePacketInput.parse(input);
  const rawThought = (await readText(parsed.file)).trim();
  const title = parsed.title ?? titleFromFile(parsed.file);
  const slug = createSlug(title);
  const lane = parsed.lane ?? "UNMAPPED";
  const validLane = isValidLane(lane);
  const status = validLane ? "draft" : "blocked";
  const template = await readText("templates/article_packet.md");
  const blockedNote = validLane
    ? ""
    : "\n\nBLOCKED: This content is unmapped. It cannot publish until it maps to one of the approved content lanes.";

  const packet = renderTemplate(template, {
    title,
    backup_title: `${title} - Systems Note`,
    slug,
    status,
    lane,
    core_idea: firstSentence(rawThought),
    clear_angle: validLane
      ? `Turn this raw thought into a ${lane} Substack signal without losing Major's voice.`
      : "BLOCKED: Unmapped content cannot publish.",
    original_raw_thought: rawThought,
    raw_conversational_edit: `${firstParagraph(rawThought)}${blockedNote}`,
    polished_editorial_edit: validLane
      ? `${firstParagraph(rawThought)}\n\nThis should be shaped into a clean editorial version for the website/blog layer while preserving the original signal.`
      : "BLOCKED: Add a valid content lane before polishing.",
    video_script: validLane
      ? `Pause.\n\n${firstSentence(rawThought)}\n\nNow turn that into a system. One thought, one article, one short video, one graph note, one public signal.\n\nIf this resonates, stay close. Because here, we build systems, not just ideas.`
      : "BLOCKED: Add a valid content lane before generating a video script.",
    date: timestamp(),
    next_action: validLane
      ? "Review packet metadata, then run Substack dry-run."
      : "Assign a valid content lane before publishing."
  });

  const outputPath = path.join("content", "articles", `${slug}.md`);
  await writeText(outputPath, packet);
  return outputPath;
}
