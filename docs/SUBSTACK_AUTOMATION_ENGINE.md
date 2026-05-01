# Substack Automation Engine

## Purpose

Turn raw thoughts into reusable article packets, GitHub markdown records, Airtable pipeline audits, Notion mirror inputs, voice/video asset prompts, and future Substack publishing workflows.

Command Center is the authority. This engine is an external artifact producer that emits packets, reports, briefs, scripts, and Mission Control artifact JSON. It does not build Mission Control UI or duplicate Command Center approval logic.

## Current Phase

This scaffold builds dry-run foundations only:

- article packet generation
- dry-run publish validation
- local daily brief generation
- Airtable read-only sync scaffold
- video/voice prompt templates

## Publishing Rule

When Airtable `Status = Scheduled`, the engine should eventually publish automatically. This scaffold does not live publish. It only identifies readiness and writes dry-run reports.

## Reaction Doctrine

Reaction Doctrine packets are for YouTube videos, podcast clips, news segments, and viral cultural moments.

They must include:

- Source URL
- Source title
- Source transcript or summary
- What they said
- What they missed
- The system underneath
- Why it matters
- 3–5 minute video script
- Substack article version
- Hook set
- Distribution plan
- Fact-check notes
- Risk notes
- System mapping

The raw rant or source summary remains preserved. The publishable material is the tightened Substack article version.

When a Scheduled Airtable record uses `Reaction Doctrine` and includes `source_url`, the dry-run pipeline locates or generates the article packet, validates Reaction Doctrine fields, runs publish dry-run, creates a 3–5 minute video script, creates 3 short clip hooks, and writes workflow logs. It does not publish live.

## Source Of Truth

GitHub is truth. Airtable tracks. Notion shows. Substack broadcasts.
