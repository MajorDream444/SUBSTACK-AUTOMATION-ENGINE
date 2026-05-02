# Publish Queue Handoff

Command Center is the authority.

`SUBSTACK-AUTOMATION-ENGINE` is an external artifact producer. This export creates a local-only publish queue manifest for assets Mission Control has already marked as publish queue candidates.

## Input

```text
content/logs/workflows/asset_workflow_state.json
```

Only artifacts with:

```text
current_status = publish_queue_candidate
```

are eligible.

Excluded statuses:

- `render_queue_candidate`
- `under_review`
- `held`
- `needs_asset_rewrite`
- `blocked`

## Output

```text
content/logs/workflows/publish_queue_handoff.json
content/logs/workflows/publish_queue_handoff.md
content/logs/workflows/publish_queue_handoff_summary.json
```

Each queued item includes paths to the dry-run asset files already generated under:

```text
content/assets/{artifact_id}/
```

## Platform Recommendation

- Substack is included when the distribution plan points to an existing article or draft.
- Instagram is included when hooks exist.
- YouTube is included when the video script and visual prompts exist.
- X is included when hooks exist.
- Fanbase is included for culture, doctrine, diaspora, or Reaction Doctrine lanes.

If required asset files are missing, the artifact is not queued. It is logged as a skipped candidate with a `blocked_reason`.

## Command

```bash
npm run export:publish-queue
```

Combined local queue export:

```bash
npm run export:queues
```

## Safety

- This is only a local publish queue manifest.
- No publishing happens here.
- No rendering.
- No browser automation.
- No external API calls.
- No secrets.
- Future distribution integrations may consume this manifest later, after Mission Control enables that layer.
