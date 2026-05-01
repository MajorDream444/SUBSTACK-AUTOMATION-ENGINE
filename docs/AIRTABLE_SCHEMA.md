# Airtable Schema

Base ID: `appSMmnuKy6GYfBPu`

Table ID: `tblK7HJAaGDAZGwDA`

Table Name: `Substack Pipeline`

## Publish Readiness Checks

The audit checks for:

- records with `Status = Scheduled`
- missing slug
- missing tags
- missing publish date
- missing Substack URL
- missing article versions
- missing hooks/video/distribution fields

## Current Write Policy

No Airtable writes are implemented in this scaffold.

If `AIRTABLE_API_KEY` exists, the engine reads records only. If no key exists, it writes a local audit explaining sync was skipped.
