# Mission Control Asset Decision Import

Command Center is the authority.

`SUBSTACK-AUTOMATION-ENGINE` is an external artifact producer. It imports Mission Control asset queue decisions and updates local dry-run workflow state only.

## Input

Set:

```bash
MISSION_CONTROL_ASSET_DECISIONS_PATH="/absolute/path/to/content/logs/workflows/asset_queue_decisions.json"
```

Or pass:

```bash
npm run import:asset-decisions -- --file /absolute/path/to/asset_queue_decisions.json
```

Accepted shape:

```json
{
  "decisions": [
    {
      "asset_decision_id": "AD-20260502-011101-AS02",
      "artifact_id": "uuid",
      "mission_id": "M-XXXXX",
      "title": "",
      "lane": "",
      "asset_state": "prepared | ready_for_distribution",
      "decision": "hold | review_assets | request_asset_rewrite | approve_for_render_queue | approve_for_publish_queue_later | block_asset",
      "decided_by": "Major",
      "decided_at": "2026-05-02T01:11:01.000Z",
      "reason": "",
      "source": "MISSION_CONTROL",
      "execution_mode": "local_only"
    }
  ]
}
```

An array of decision objects is also accepted.

## Status Mapping

- `hold` -> `held`
- `review_assets` -> `under_review`
- `request_asset_rewrite` -> `needs_asset_rewrite`
- `approve_for_render_queue` -> `render_queue_candidate`
- `approve_for_publish_queue_later` -> `publish_queue_candidate`
- `block_asset` -> `blocked`

## Outputs

- `content/logs/workflows/mission_control_asset_queue_decisions.json`
- `content/logs/workflows/mission_control_asset_queue_decisions.md`
- `content/logs/workflows/asset_workflow_state.json`
- `content/logs/workflows/asset_queue_decision_import_summary.json`

The raw imported decision file is copied into `mission_control_asset_queue_decisions.json`. The source file is not mutated.

## De-Dupe Rule

The importer preserves all unique `asset_decision_id` values already in `asset_workflow_state.json`.

Duplicate incoming `asset_decision_id` values are ignored. The newest decision for each `artifact_id`, based on `decided_at`, becomes that artifact's `current_status`.

## Safety

- No live publishing.
- No rendering.
- No generated asset files are mutated.
- No external API calls.
- No secrets.
- No Mission Control UI or approval logic is duplicated here.
