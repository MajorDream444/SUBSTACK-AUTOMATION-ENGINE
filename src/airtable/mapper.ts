import type { AirtableRecord } from "./client.js";
import { timestamp } from "../utils/dates.js";

const FIELD_ALIASES: Record<string, string[]> = {
  status: ["Status", "status"],
  title: ["Title", "title", "Name", "Post Title"],
  slug: ["slug", "Slug"],
  tags: ["tags", "Tags"],
  publishDate: ["publish date", "Publish Date", "publish_date"],
  substackUrl: ["Substack URL", "substack_url", "Substack Url"],
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

export function title(record: AirtableRecord): string {
  return text(field(record.fields, "title")) || record.id;
}

export function renderAirtableAudit(records: AirtableRecord[], skippedReason?: string): string {
  const scheduled = records.filter((record) => status(record).toLowerCase() === "scheduled");
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
