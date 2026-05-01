import path from "node:path";
import { generateArticlePacket } from "./articlePacket.js";
import { createSlug } from "./slug.js";
import { publishDryRun } from "../substack/dryRunPublisher.js";
import type { AirtableRecord } from "../airtable/client.js";
import {
  isScheduledReactionDoctrine,
  reactionDoctrineRecord,
  validateReactionDoctrineRecord
} from "../airtable/mapper.js";
import { fileExists, readText, writeText } from "../utils/fs.js";
import { timestamp } from "../utils/dates.js";

export type ReactionDoctrineWorkflowResult = {
  recordId: string;
  title: string;
  sourceUrl: string;
  articlePath?: string;
  dryRunReportPath?: string;
  workflowLogPath: string;
  ready: boolean;
  errors: string[];
};

function sourceBody(record: ReturnType<typeof reactionDoctrineRecord>): string {
  return [
    `Source URL: ${record.sourceUrl}`,
    `Source Title: ${record.sourceTitle || "Untitled source"}`,
    "",
    "Source transcript or summary:",
    record.sourceSummary || "TODO: Add source transcript or summary.",
    "",
    "What they said:",
    record.whatTheySaid || "TODO: Extract what they said.",
    "",
    "What they missed:",
    record.whatTheyMissed || "TODO: Extract what they missed.",
    "",
    "The system underneath:",
    record.systemUnderneath || "TODO: Name the system underneath.",
    "",
    "Why it matters:",
    record.whyItMatters || "TODO: Explain why it matters."
  ].join("\n");
}

function videoScript(record: ReturnType<typeof reactionDoctrineRecord>): string {
  return `# 3–5 Minute Reaction Doctrine Video Script

Open with the source:
"${record.sourceTitle || record.title}"

Pause.

What they said:
${record.whatTheySaid || "TODO: Extract the direct claim or frame."}

What they missed:
${record.whatTheyMissed || "TODO: Identify the missing system layer."}

The system underneath:
${record.systemUnderneath || "TODO: Name the underlying system."}

Why it matters:
${record.whyItMatters || "TODO: Explain why this matters beyond the clip."}

Do not turn this into generic political commentary. Bring it back to Major AI OS, culture, doctrine, diaspora, media, or leverage.

Close:
If this resonates, stay close. Because here, we build systems, not just ideas.
`;
}

function shortClipHooks(record: ReturnType<typeof reactionDoctrineRecord>): string[] {
  const system = record.systemUnderneath || "the system underneath the moment";
  return [
    `They saw the clip. They missed ${system}.`,
    "This is not a viral moment. It is a system showing itself.",
    "The real story is not what they said. It is what the machine revealed."
  ];
}

async function locateOrGenerateArticle(record: ReturnType<typeof reactionDoctrineRecord>): Promise<string> {
  const slug = record.slug || createSlug(record.title);
  const articlePath = path.join("content", "articles", `${slug}.md`);
  if (await fileExists(articlePath)) return articlePath;

  const rawPath = path.join("content", "raw", `${slug}-source.txt`);
  if (!(await fileExists(rawPath))) {
    await writeText(rawPath, sourceBody(record));
  }

  return generateArticlePacket({
    file: rawPath,
    title: record.title,
    lane: "Reaction Doctrine",
    sourceUrl: record.sourceUrl,
    sourceTitle: record.sourceTitle || record.title
  });
}

export async function runReactionDoctrineDryRun(records: AirtableRecord[]): Promise<ReactionDoctrineWorkflowResult[]> {
  const candidates = records.filter(isScheduledReactionDoctrine);
  const results: ReactionDoctrineWorkflowResult[] = [];

  for (const airtableRecord of candidates) {
    const record = reactionDoctrineRecord(airtableRecord);
    const errors = validateReactionDoctrineRecord(airtableRecord);
    const workflowSlug = record.slug || createSlug(record.title);
    const workflowLogPath = path.join("content", "logs", "workflows", `${workflowSlug}-reaction-doctrine.md`);
    let articlePath: string | undefined;
    let dryRunReportPath: string | undefined;

    if (errors.length === 0) {
      articlePath = await locateOrGenerateArticle(record);
      dryRunReportPath = await publishDryRun({ file: articlePath });
    }

    const script = videoScript(record);
    const hooks = shortClipHooks(record);
    const log = `# Reaction Doctrine Workflow Log

Generated: ${timestamp()}
Record ID: ${record.id}
Title: ${record.title}
Source URL: ${record.sourceUrl}
Source Title: ${record.sourceTitle || "missing"}
Ready: ${errors.length === 0 ? "yes" : "no"}

## Article Packet

${articlePath ?? "Not generated because validation failed."}

## Publish Dry-Run

${dryRunReportPath ?? "Not run because validation failed."}

## Validation

${errors.length ? errors.map((error) => `- ${error}`).join("\n") : "- Passed"}

## 3–5 Minute Video Script

${script}

## 3 Short Clip Hooks

${hooks.map((hook, index) => `${index + 1}. ${hook}`).join("\n")}

## Rules

- No live publishing was attempted.
- Preserve raw rant/source as original source.
- Publish only the tightened version.
- Extract the system underneath the clip.
`;

    await writeText(workflowLogPath, log);
    results.push({
      recordId: record.id,
      title: record.title,
      sourceUrl: record.sourceUrl,
      articlePath,
      dryRunReportPath,
      workflowLogPath,
      ready: errors.length === 0,
      errors
    });
  }

  await writeText(
    "content/logs/workflows/reaction_doctrine_pipeline.md",
    renderReactionDoctrineSummary(results)
  );

  return results;
}

export function renderReactionDoctrineSummary(results: ReactionDoctrineWorkflowResult[]): string {
  return `# Reaction Doctrine Pipeline

Generated: ${timestamp()}
Candidates processed: ${results.length}

## Results

${
  results.length
    ? results
        .map((result) =>
          [
            `### ${result.title}`,
            "",
            `- Record ID: ${result.recordId}`,
            `- Source URL: ${result.sourceUrl}`,
            `- Ready: ${result.ready ? "yes" : "no"}`,
            `- Article packet: ${result.articlePath ?? "not generated"}`,
            `- Dry-run report: ${result.dryRunReportPath ?? "not run"}`,
            `- Workflow log: ${result.workflowLogPath}`,
            `- Errors: ${result.errors.length ? result.errors.join("; ") : "none"}`
          ].join("\n")
        )
        .join("\n\n")
    : "- No Scheduled Reaction Doctrine records with source_url were found."
}

## Safety

- Dry-run only.
- No live posting.
- No Airtable writes.
`;
}
