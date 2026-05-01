import path from "node:path";
import { z } from "zod";
import { isValidLane } from "./lanes.js";
import { createSlug } from "./slug.js";
import { readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

const GenerateArticlePacketInput = z.object({
  file: z.string().min(1),
  title: z.string().optional(),
  lane: z.string().optional(),
  sourceUrl: z.string().optional(),
  sourceTitle: z.string().optional()
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

function reactionDoctrineBlock(input: {
  rawThought: string;
  sourceUrl?: string;
  sourceTitle?: string;
  validLane: boolean;
}): string {
  if (!input.validLane) return "";

  return `

# Reaction Doctrine Packet

## Source URL

${input.sourceUrl ?? "TODO: Add source URL."}

## Source Title

${input.sourceTitle ?? "TODO: Add source title."}

## Source Transcript or Summary

${input.rawThought}

## What They Said

TODO: Extract the direct claim, frame, or emotional charge from the source.

## What They Missed

TODO: Identify the unseen leverage, incentive, historical pattern, ownership layer, or system design underneath the clip.

## The System Underneath

TODO: Name the system beneath the moment. Map it to Major AI OS, culture, doctrine, diaspora, media, or leverage.

## Why It Matters

TODO: Explain why this moment matters beyond the timeline cycle.

## 3–5 Minute Video Script

Open with the clip's surface claim. Pause. Then move into the system underneath it.

Do not become generic political commentary. Tighten the raw rant into system-level analysis with Major's voice: raw, conversational, slightly provocative, high-signal.

Close with: If this resonates, stay close. Because here, we build systems, not just ideas.

## Substack Article Version

TODO: Publish only this tightened version, not the raw rant. Preserve the raw rant above as original source material.

## Reaction Hook Set
- Hook 1: They are reacting to the clip. I am reading the system underneath it.
- Hook 2: This is not just a viral moment. It is a map.
- Hook 3: What they said matters. What they missed matters more.
- Hook 4: The culture keeps showing us the machine if we know how to read it.
- Hook 5: This is doctrine, not outrage.

## Reaction Distribution Plan
- Substack: Publish the tightened system-level article version.
- YouTube: Use the 3–5 minute video script.
- X / Twitter: Turn "what they missed" into a thread.
- Instagram: Turn the system underneath into a carousel or quote reel.
- Remotion: Build a caption-led explainer from the hook set.
- HeyGen: Build a direct-camera avatar explainer.

## Fact-Check Notes

TODO: List claims that need verification before publishing. Add source links, dates, names, and uncertainty notes.

## Risk Notes

TODO: Identify defamation, misinformation, privacy, copyright, platform, and unnecessary political-commentary risks.

## Reaction System Mapping
- Major AI OS:
- Culture:
- Doctrine:
- Diaspora:
- Media:
- Leverage:
`;
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

  const basePacket = renderTemplate(template, {
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
  const packet =
    lane === "Reaction Doctrine"
      ? `${basePacket}${reactionDoctrineBlock({
          rawThought,
          sourceUrl: parsed.sourceUrl,
          sourceTitle: parsed.sourceTitle,
          validLane
        })}`
      : basePacket;

  const outputPath = path.join("content", "articles", `${slug}.md`);
  await writeText(outputPath, packet);
  return outputPath;
}
