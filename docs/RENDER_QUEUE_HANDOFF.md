# Render Queue Handoff

Command Center is the authority.

`SUBSTACK-AUTOMATION-ENGINE` is an external artifact producer. This export creates a local-only render queue manifest for assets Mission Control has already marked as render queue candidates.

## Input

```text
content/logs/workflows/asset_workflow_state.json
```

Only artifacts with:

```text
current_status = render_queue_candidate
```

are eligible.

Excluded statuses:

- `publish_queue_candidate`
- `under_review`
- `held`
- `needs_asset_rewrite`
- `blocked`

## Output

```text
content/logs/workflows/render_queue_handoff.json
content/logs/workflows/render_queue_handoff.md
content/logs/workflows/render_queue_handoff_summary.json
```

Each queued item includes paths to the dry-run asset files already generated under:

```text
content/assets/{artifact_id}/
```

## Renderer Recommendation

- `Reaction Doctrine` -> `remotion`
- `Doctrine` or `Major AI OS` -> `heygen`
- high-risk lanes, blocked items, or missing assets -> `manual_review`

If required asset files are missing, the artifact is not queued. It is logged as a skipped candidate with a `blocked_reason`.

## Command

```bash
npm run export:render-queue
```

## Safety

- This is only a local queue manifest.
- No rendering happens here.
- No browser automation.
- No live publishing.
- No external API calls.
- No secrets.
- Future renderer integrations may consume this manifest later, after Mission Control enables that layer.
