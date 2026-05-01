# Mission Control Decision Import

Command Center is the authority.

`SUBSTACK-AUTOMATION-ENGINE` is an external artifact producer. It imports Mission Control decisions, updates local artifact JSON, and generates dry-run reports only. It does not live publish.

## Input

`content/logs/workflows/mission_control_decisions.json`

Accepted shape:

```json
{
  "decisions": [
    {
      "artifact_id": "uuid",
      "decision": "approved | rejected | rewrite_requested | publish_requested",
      "mission_id": "M-XXXXX",
      "decided_by": "Mission Control",
      "reason": "",
      "next_action": ""
    }
  ]
}
```

An array of decisions is also accepted.

## Status Mapping

- `approved` -> `ready`
- `rejected` -> `blocked`
- `rewrite_requested` -> `needs_rewrite`
- `publish_requested` -> `scheduled_dry_run`

## Publish Requested Rule

`publish_requested` never live publishes. It runs `publish:dry` behavior against the artifact `github_path` and writes a dry-run report.

## Asset Generation After Decisions

After decisions are imported, run:

```bash
npm run generate:assets
```

Eligible statuses:

- `ready` -> asset generation state `prepared`
- `scheduled_dry_run` -> asset generation state `ready_for_distribution`

Skipped statuses:

- `blocked`
- `needs_rewrite`
- `rejected`
- `draft`
- `needs_review`

Reaction Doctrine artifacts must include a strong `system underneath` section. If the section is missing or weak, asset generation is skipped and logged as blocked.

Combined command:

```bash
npm run handoff:decisions:assets
```

This imports Mission Control decisions and then generates dry-run assets. It does not publish live and does not call external APIs.

## Outputs

- `content/logs/workflows/mission_control_decision_import.md`
- `content/logs/workflows/decision_import_summary.json`
- `content/logs/workflows/asset_generation_log.md`
- `content/logs/workflows/asset_generation_log.json`
- `content/logs/workflows/asset_generation_summary.json`

## Command

```bash
npm run import:decisions
```

Optional custom input path:

```bash
npm run import:decisions -- --file content/logs/workflows/mission_control_decisions.json
```
