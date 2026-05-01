# Handoff

## Current State

First production scaffold for `SUBSTACK-AUTOMATION-ENGINE` is built.

## Safety Boundary

- Live Substack publishing is not implemented.
- Airtable writes are not implemented.
- External API calls only happen when matching keys are configured.
- Secrets must not be committed.

## Next Action

Validate Airtable field mapping with real records after `AIRTABLE_API_KEY` is added, then plan live Substack publishing as a separate phase.

## Verification — 2026-05-01

Commands run:

- `npm install`
- `npm run build`
- created `content/raw/sample-major-thought.txt`
- `npm run generate:article -- --file content/raw/sample-major-thought.txt --title "Sample Major Thought" --lane "Major AI OS productization"`
- `npm run publish:dry -- --file content/articles/sample-major-thought.md`
- `npm run brief`
- `npm run sync:airtable`
- secret scan for populated API key/password assignments

Results:

- Build passed.
- Article packet created at `content/articles/sample-major-thought.md`.
- Dry-run publish report created at `content/logs/workflows/substack_dry_run_report.md`.
- Daily brief created at `content/logs/daily/2026-05-01-daily-brief.md`.
- Airtable audit created at `content/logs/workflows/airtable_audit.md`.
- Airtable remote read was skipped because no `AIRTABLE_API_KEY` is configured.
- No populated secrets were found in scaffold files.

Known gaps:

- Airtable field mapping still needs live validation with real records.
- No Airtable writes are implemented.
- No live Substack publishing is implemented.
- Notion, n8n, Remotion rendering, HeyGen generation, and AI Voice Generator calls are templates/placeholders only.

## Update — Reaction Doctrine Lane

Changed:

- Added `Reaction Doctrine` as a valid content lane.
- Added Reaction Doctrine packet sections for source URL, source title, source transcript/summary, what they said, what they missed, the system underneath, why it matters, 3–5 minute video script, Substack article version, hook set, distribution plan, fact-check notes, risk notes, and system mapping.
- Added optional generator flags: `--source-url` and `--source-title`.
- Updated dry-run publisher to remind agents that Reaction Doctrine publishes only the tightened Substack Article Version, not the preserved raw rant/source.

Verification:

- `npm run generate:article -- --file content/raw/sample-reaction-doctrine.txt --title "Sample Reaction Doctrine" --lane "Reaction Doctrine" --source-url "https://example.com/source" --source-title "Example Cultural Clip"`
- `npm run publish:dry -- --file content/articles/sample-reaction-doctrine.md`
- `npm run build`
- secret scan for populated API key/password assignments

Result:

- Reaction Doctrine packet generated at `content/articles/sample-reaction-doctrine.md`.
- Dry-run report generated and passed.
- TypeScript build passed.
- No populated secrets were found.

## Update — Reaction Doctrine Airtable Dry-Run Pipeline

Changed:

- Added `source_url` and `source_title` support to the Airtable mapper.
- Added Reaction Doctrine record validation for Scheduled Airtable records.
- Connected Scheduled Reaction Doctrine records with `source_url` to the dry-run pipeline.
- The pipeline now locates or generates an article packet, runs publish dry-run, creates a 3–5 minute video script, creates 3 short clip hooks, and writes workflow logs.
- Added `content/research/reaction_doctrine_airtable_fixture.json` as a sample Airtable-style fixture.
- Added `content/logs/workflows/reaction_doctrine_pipeline.md` and per-record workflow logs.

Verification:

- `npm run build`
- `npm run sync:airtable -- --fixture content/research/reaction_doctrine_airtable_fixture.json`
- `npm run publish:dry -- --file content/articles/fixture-reaction-doctrine-clip.md`
- `npm run brief`
- `npm run sync:airtable`
- final fixture rerun: `npm run sync:airtable -- --fixture content/research/reaction_doctrine_airtable_fixture.json`
- final brief rerun: `npm run brief`

Results:

- TypeScript build passed.
- Fixture pipeline processed 1 Scheduled Reaction Doctrine candidate.
- Article packet located/generated at `content/articles/fixture-reaction-doctrine-clip.md`.
- Publish dry-run passed.
- Workflow log created at `content/logs/workflows/fixture-reaction-doctrine-clip-reaction-doctrine.md`.
- Reaction Doctrine pipeline summary created at `content/logs/workflows/reaction_doctrine_pipeline.md`.
- Daily brief regenerated.
- No live publishing, live posting, or Airtable writes were attempted.

## Update — Mission Control Artifact Contract

Changed:

- Added `src/artifacts/artifactContract.ts`.
- Added `src/artifacts/scoring.ts`.
- Added `src/artifacts/riskGovernance.ts`.
- Added `scripts/export_mission_control.ts`.
- Added `docs/MISSION_CONTROL_INTERFACE.md`.
- Packet generation now emits Mission Control-compatible artifact JSON files under `content/logs/agents/artifacts/`.
- Mission Control export writes `content/logs/workflows/mission_control_export.json` and `content/logs/workflows/mission_control_export.md`.
- SYSTEM_CORE, AGENTS, README, and Substack docs now state that Command Center is the authority and this repo is an external artifact producer.

Verification:

- `npm run build`
- `npm run generate:article -- --file content/raw/sample-reaction-doctrine.txt --title "Sample Reaction Doctrine" --lane "Reaction Doctrine" --source-url "https://example.com/source" --source-title "Example Cultural Clip"`
- `npm run sync:airtable -- --fixture content/research/reaction_doctrine_airtable_fixture.json`
- `npm run export:mission-control`
- `npm run publish:dry -- --file content/articles/sample-reaction-doctrine.md`
- `npm run brief`
- secret scan for populated API key/password assignments

Artifact contract summary:

- Total artifacts exported: 2
- Needs review: 2
- Blocked: 1
- Auto candidates: 0
- High risk review required: 0
- Reaction Doctrine fixture artifact: `needs_review`, `publish_mode = review`
- Sample Reaction Doctrine artifact: `blocked`, `publish_mode = block`, score capped at 50 because system-underneath is weak

Known boundary:

- Command Center remains the authority.
- This repo does not build Mission Control UI, global approval UI, or Command Center approval logic.
- `delay` publish mode is reserved for future and is not activated.
