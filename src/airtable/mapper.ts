import type { AirtableRecord } from "./client.js";
import { timestamp } from "../utils/dates.js";
import { isValidLane } from "../content/lanes.js";

const FIELD_ALIASES: Record<string, string[]> = {
  status: ["Status", "status"],
  title: ["Title", "title", "Name", "Post Title"],
  lane: ["lane", "Lane", "Content Lane", "content lane"],
  slug: ["slug", "Slug"],
  tags: ["tags", "Tags"],
  publishDate: ["publish date", "Publish Date", "publish_date"],
  substackUrl: ["Substack URL", "substack_url", "Substack Url"],
  sourceUrl: ["source_url", "Source URL", "source url", "Source Url"],
  sourceTitle: ["source_title", "Source Title", "source title"],
  sourceSummary: ["source transcript or summary", "Source Transcript or Summary", "source_summary", "Source Summary", "Transcript", "Summary"],
  whatTheySaid: ["What They Said", "what they said", "what_they_said"],
  whatTheyMissed: ["What They Missed", "what they missed", "what_they_missed"],
  systemUnderneath: ["The System Underneath", "system underneath", "system_underneath"],
  whyItMatters: ["Why It Matters", "why it matters", "why_it_matters"],
  factCheckNotes: ["Fact-Check Notes", "Fact Check Notes", "fact_check_notes"],
  riskNotes: ["Risk Notes", "risk_notes"],
  rawConversationalEdit: ["raw conversational edit", "Raw Conversational Edit"],
  polishedEditorialEdit: ["polished editorial edit", "Polished Editorial Edit"],
  hooks: ["hooks", "Hooks", "Hook Set"],
  videoScript: ["video script", "Video Script", "60-Second Video Script"],
  distributionPlan: ["distribution plan", "Distribution Plan"]
};

function field(fields: Record<string, unknown>, key: string): unknown {
  const aliases = FIELD_ALIASES[key] ?? [key];
  const match = aliases.find((alias) => {
    const value = fields[alias];
    return value !== undefined && value !== null && value !== "";
  });
  return match ? fields[match] : undefined;
}

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value ?? "").trim();
}

export function normalizeAirtableRecord(record: AirtableRecord): Record<string, unknown> {
  return {
    id: record.id,
    createdTime: record.createdTime,
    ...record.fields
  };
}

export function missingFields(record: AirtableRecord): string[] {
  const required = [
    "slug",
    "tags",
    "publishDate",
    "substackUrl",
    "rawConversationalEdit",
    "polishedEditorialEdit",
    "hooks",
    "videoScript",
    "distributionPlan"
  ];
  return required.filter((key) => field(record.fields, key) === undefined);
}

export function status(record: AirtableRecord): string {
  return text(field(record.fields, "status"));
}

export function lane(record: AirtableRecord): string {
  return text(field(record.fields, "lane"));
}

export function title(record: AirtableRecord): string {
  return text(field(record.fields, "title")) || record.id;
}

export type ReactionDoctrineRecord = {
  id: string;
  title: string;
  slug?: string;
  lane: string;
  status: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceSummary: string;
  whatTheySaid: string;
  whatTheyMissed: string;
  systemUnderneath: string;
  whyItMatters: string;
  factCheckNotes: string;
  riskNotes: string;
};

export function reactionDoctrineRecord(record: AirtableRecord): ReactionDoctrineRecord {
  return {
    id: record.id,
    title: title(record),
    slug: text(field(record.fields, "slug")) || undefined,
    lane: lane(record),
    status: status(record),
    sourceUrl: text(field(record.fields, "sourceUrl")),
    sourceTitle: text(field(record.fields, "sourceTitle")),
    sourceSummary: text(field(record.fields, "sourceSummary")),
    whatTheySaid: text(field(record.fields, "whatTheySaid")),
    whatTheyMissed: text(field(record.fields, "whatTheyMissed")),
    systemUnderneath: text(field(record.fields, "systemUnderneath")),
    whyItMatters: text(field(record.fields, "whyItMatters")),
    factCheckNotes: text(field(record.fields, "factCheckNotes")),
    riskNotes: text(field(record.fields, "riskNotes"))
  };
}

export function isScheduledReactionDoctrine(record: AirtableRecord): boolean {
  const mapped = reactionDoctrineRecord(record);
  return mapped.status.toLowerCase() === "scheduled" && mapped.lane === "Reaction Doctrine" && Boolean(mapped.sourceUrl);
}

export function validateReactionDoctrineRecord(record: AirtableRecord): string[] {
  const mapped = reactionDoctrineRecord(record);
  const missing: string[] = [];

  if (mapped.lane !== "Reaction Doctrine") missing.push("lane must be Reaction Doctrine");
  if (mapped.status.toLowerCase() !== "scheduled") missing.push("status must be Scheduled");
  if (!isValidLane(mapped.lane)) missing.push("lane is not recognized by engine");
  if (!mapped.sourceUrl) missing.push("source_url");
  if (!mapped.sourceTitle) missing.push("source_title");
  if (!mapped.sourceSummary) missing.push("source transcript or summary");
  if (!mapped.whatTheySaid) missing.push("What They Said");
  if (!mapped.whatTheyMissed) missing.push("What They Missed");
  if (!mapped.systemUnderneath) missing.push("The System Underneath");
  if (!mapped.whyItMatters) missing.push("Why It Matters");
  if (!mapped.factCheckNotes) missing.push("Fact-Check Notes");
  if (!mapped.riskNotes) missing.push("Risk Notes");

  return missing;
}

export function renderAirtableAudit(records: AirtableRecord[], skippedReason?: string): string {
  const scheduled = records.filter((record) => status(record).toLowerCase() === "scheduled");
  const reactionCandidates = records.filter(isScheduledReactionDoctrine);
  const reactionBlocked = records
    .filter((record) => lane(record) === "Reaction Doctrine" || isScheduledReactionDoctrine(record))
    .map((record) => ({
      id: record.id,
      title: title(record),
      missing: validateReactionDoctrineRecord(record)
    }))
    .filter((entry) => entry.missing.length > 0);
  const missing = records
    .map((record) => ({
      id: record.id,
      title: title(record),
      status: status(record) || "missing",
      missing: missingFields(record)
    }))
    .filter((entry) => entry.missing.length > 0);

  const lines = [
    "# Airtable Audit",
    "",
    `Generated: ${timestamp()}`,
    "",
    `Records read: ${records.length}`,
    `Scheduled records: ${scheduled.length}`,
    skippedReason ? `Airtable sync skipped: ${skippedReason}` : "",
    "",
    "## Scheduled Records",
    ...(scheduled.length ? scheduled.map((record) => `- ${record.id}: ${title(record)}`) : ["- None"]),
    "",
    "## Scheduled Reaction Doctrine Candidates",
    ...(reactionCandidates.length
      ? reactionCandidates.map((record) => {
          const mapped = reactionDoctrineRecord(record);
          return `- ${record.id}: ${mapped.title} | source_url: ${mapped.sourceUrl}`;
        })
      : ["- None"]),
    "",
    "## Reaction Doctrine Validation",
    ...(reactionBlocked.length
      ? reactionBlocked.map((entry) => `- ${entry.id} (${entry.title}): ${entry.missing.join(", ")}`)
      : ["- None"]),
    "",
    "## Missing Field Audit",
    ...(missing.length
      ? missing.map((entry) => `- ${entry.id} (${entry.title}, ${entry.status}): ${entry.missing.join(", ")}`)
      : ["- None"]),
    "",
    "## Write Policy",
    "- No Airtable writes were attempted.",
    "- This scaffold is read-only."
  ];

  return `${lines.filter((line, index, arr) => line !== "" || arr[index - 1] !== "").join("\n")}\n`;
}
