import dotenv from "dotenv";

dotenv.config();

export const env = {
  airtableApiKey: process.env.AIRTABLE_API_KEY ?? "",
  airtableBaseId: process.env.AIRTABLE_BASE_ID ?? "appSMmnuKy6GYfBPu",
  airtableSubstackTableId: process.env.AIRTABLE_SUBSTACK_TABLE_ID ?? "tblK7HJAaGDAZGwDA",
  notionApiKey: process.env.NOTION_API_KEY ?? "",
  substackEmail: process.env.SUBSTACK_EMAIL ?? "",
  substackPassword: process.env.SUBSTACK_PASSWORD ?? "",
  substackPublicationUrl: process.env.SUBSTACK_PUBLICATION_URL ?? "https://majordreamwilliams.substack.com",
  substackDryRun: (process.env.SUBSTACK_DRY_RUN ?? "true").toLowerCase() !== "false",
  githubRepo: process.env.GITHUB_REPO ?? "MajorDream444/SUBSTACK-AUTOMATION-ENGINE",
  heygenApiKey: process.env.HEYGEN_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  xApiKey: process.env.X_API_KEY ?? "",
  igAccessToken: process.env.IG_ACCESS_TOKEN ?? "",
  missionControlAssetDecisionsPath: process.env.MISSION_CONTROL_ASSET_DECISIONS_PATH ?? ""
};

export function hasAirtableCredentials(): boolean {
  return Boolean(env.airtableApiKey && env.airtableBaseId && env.airtableSubstackTableId);
}
