import { env, hasAirtableCredentials } from "../config/env.js";

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
};

type AirtableListResponse = {
  records: AirtableRecord[];
  offset?: string;
};

export async function listSubstackPipelineRecords(): Promise<AirtableRecord[]> {
  if (!hasAirtableCredentials()) return [];

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(
      `https://api.airtable.com/v0/${env.airtableBaseId}/${env.airtableSubstackTableId}`
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.airtableApiKey}`
      }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Airtable read failed: ${response.status} ${response.statusText} ${body.slice(0, 240)}`);
    }

    const json = (await response.json()) as AirtableListResponse;
    records.push(...json.records);
    offset = json.offset;
  } while (offset);

  return records;
}
