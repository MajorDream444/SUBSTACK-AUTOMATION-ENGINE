# Airtable Schema

Base ID: `appSMmnuKy6GYfBPu`

Table ID: `tblK7HJAaGDAZGwDA`

Table Name: `Substack Pipeline`

## Publish Readiness Checks

The audit checks for:

- records with `Status = Scheduled`
- records with `Lane = Reaction Doctrine`
- `source_url`
- `source_title`
- missing slug
- missing tags
- missing publish date
- missing Substack URL
- missing article versions
- missing hooks/video/distribution fields

## Current Write Policy

No Airtable writes are implemented in this scaffold.

If `AIRTABLE_API_KEY` exists, the engine reads records only. If no key exists, it writes a local audit explaining sync was skipped.

## Reaction Doctrine Dry-Run Pipeline

If a Substack Pipeline record has:

- `Lane = Reaction Doctrine`
- `source_url` exists
- `Status = Scheduled`

Then `npm run sync:airtable` will:

1. locate or generate the article packet
2. validate required Reaction Doctrine fields
3. run the Substack dry-run publisher
4. generate a 3–5 minute video script
5. generate 3 short clip hooks
6. write a workflow log
7. avoid all live publishing

Local fixture test:

```bash
npm run sync:airtable -- --fixture content/research/reaction_doctrine_airtable_fixture.json
```
