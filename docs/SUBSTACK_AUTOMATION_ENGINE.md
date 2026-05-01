# Substack Automation Engine

## Purpose

Turn raw thoughts into reusable article packets, GitHub markdown records, Airtable pipeline audits, Notion mirror inputs, voice/video asset prompts, and future Substack publishing workflows.

## Current Phase

This scaffold builds dry-run foundations only:

- article packet generation
- dry-run publish validation
- local daily brief generation
- Airtable read-only sync scaffold
- video/voice prompt templates

## Publishing Rule

When Airtable `Status = Scheduled`, the engine should eventually publish automatically. This scaffold does not live publish. It only identifies readiness and writes dry-run reports.

## Source Of Truth

GitHub is truth. Airtable tracks. Notion shows. Substack broadcasts.
