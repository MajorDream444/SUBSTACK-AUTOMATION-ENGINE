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

## Update — Mission Control Decision Import

Changed:

- Added `src/artifacts/decisionImport.ts`.
- Added `scripts/import_mission_control_decisions.ts`.
- Added `docs/MISSION_CONTROL_DECISION_IMPORT.md`.
- Added `npm run import:decisions`.

Behavior:

- Reads `content/logs/workflows/mission_control_decisions.json`.
- Matches decisions by `artifact_id`.
- Updates local artifact JSON status:
  - `approved` -> `ready`
  - `rejected` -> `blocked`
  - `rewrite_requested` -> `needs_rewrite`
  - `publish_requested` -> `scheduled_dry_run`
- `publish_requested` runs dry-run report only.
- Never live publishes.

Verification is recorded in the latest workflow logs:

- `content/logs/workflows/mission_control_decision_import.md`
- `content/logs/workflows/decision_import_summary.json`

## Update — Dry-Run Asset Generation

Changed:

- Added `src/artifacts/assetGeneration.ts`.
- Added `scripts/generate_assets.ts`.
- Added `npm run generate:assets`.
- Added `npm run handoff:decisions`.
- Added `npm run handoff:decisions:assets`.

Behavior:

- `ready` artifacts generate assets with `asset_state = prepared`.
- `scheduled_dry_run` artifacts generate assets with `asset_state = ready_for_distribution`.
- `blocked`, `needs_rewrite`, `rejected`, `draft`, and `needs_review` artifacts are skipped.
- Reaction Doctrine artifacts without a strong system-underneath section are skipped and logged.
- No live publishing or external API calls are performed.

Outputs:

- `content/assets/{artifact_id}/video_script.md`
- `content/assets/{artifact_id}/voice_script.txt`
- `content/assets/{artifact_id}/hooks.json`
- `content/assets/{artifact_id}/visual_prompts.json`
- `content/assets/{artifact_id}/distribution_plan.json`
- `content/assets/{artifact_id}/asset_manifest.json`
- `content/logs/workflows/asset_generation_log.md`
- `content/logs/workflows/asset_generation_log.json`
- `content/logs/workflows/asset_generation_summary.json`

Verification:

- `npm run build`
- `npm run handoff:decisions:assets`
- `npm run brief`
- secret scan for populated API key/password assignments
- asset-generation source scan for live network/client calls

Results:

- Artifacts scanned: 3
- Assets generated: 2
- Assets skipped: 1
- `ready` artifact generated `asset_state = prepared`
- `scheduled_dry_run` artifact generated `asset_state = ready_for_distribution`
- `needs_rewrite` artifact was skipped
- Reaction Doctrine eligible artifact included a system-underneath section and generated assets
- No live publishing occurred
- No external API calls were added to the asset generation/import scripts
- No populated secrets were found

## Update - Mission Control Asset Queue Decision Import

Added:

- `src/artifacts/assetDecisionImport.ts`
- `scripts/import_asset_queue_decisions.ts`
- `docs/MISSION_CONTROL_ASSET_DECISION_IMPORT.md`
- `npm run import:asset-decisions`
- `npm run handoff:asset-decisions`
- `npm run handoff:full:local`

Behavior:

- Reads Mission Control `asset_queue_decisions.json` from `MISSION_CONTROL_ASSET_DECISIONS_PATH` or `--file`.
- Copies the raw imported decision file into `content/logs/workflows/mission_control_asset_queue_decisions.json`.
- Writes a human report to `content/logs/workflows/mission_control_asset_queue_decisions.md`.
- Updates dry-run state in `content/logs/workflows/asset_workflow_state.json`.
- Writes `content/logs/workflows/asset_queue_decision_import_summary.json`.
- De-dupes by `asset_decision_id`.
- Newest decision by `decided_at` becomes the artifact `current_status`.

Safety:

- No generated asset files are mutated.
- No rendering.
- No live publishing.
- No external API calls.

## Update - Render Queue Handoff Export

Added:

- `src/artifacts/renderQueueHandoff.ts`
- `scripts/export_render_queue_handoff.ts`
- `docs/RENDER_QUEUE_HANDOFF.md`
- `npm run export:render-queue`

Behavior:

- Reads `content/logs/workflows/asset_workflow_state.json`.
- Includes only artifacts with `current_status = render_queue_candidate`.
- Excludes `publish_queue_candidate`, `under_review`, `held`, `needs_asset_rewrite`, and `blocked`.
- Writes:
  - `content/logs/workflows/render_queue_handoff.json`
  - `content/logs/workflows/render_queue_handoff.md`
  - `content/logs/workflows/render_queue_handoff_summary.json`
- Preserves an existing `render_queue_id` for the same `artifact_id`.
- Logs missing required asset files as skipped candidates instead of queueing them.

Safety:

- Local manifest only.
- No generated asset files are mutated.
- No rendering, browser automation, publishing, external APIs, or secrets.

## Update - Publish Queue Handoff Export

Added:

- `src/artifacts/publishQueueHandoff.ts`
- `scripts/export_publish_queue_handoff.ts`
- `docs/PUBLISH_QUEUE_HANDOFF.md`
- `npm run export:publish-queue`
- `npm run export:queues`

Behavior:

- Reads `content/logs/workflows/asset_workflow_state.json`.
- Includes only artifacts with `current_status = publish_queue_candidate`.
- Excludes `render_queue_candidate`, `under_review`, `held`, `needs_asset_rewrite`, and `blocked`.
- Writes:
  - `content/logs/workflows/publish_queue_handoff.json`
  - `content/logs/workflows/publish_queue_handoff.md`
  - `content/logs/workflows/publish_queue_handoff_summary.json`
- Preserves an existing `publish_queue_id` for the same `artifact_id`.
- Logs missing required asset files as skipped candidates instead of queueing them.
- Recommends platforms from local asset availability only.

Safety:

- Local manifest only.
- No generated asset files are mutated.
- No publishing, rendering, browser automation, external APIs, or secrets.
