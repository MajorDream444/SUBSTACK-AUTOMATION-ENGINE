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

## Outputs

- `content/logs/workflows/mission_control_decision_import.md`
- `content/logs/workflows/decision_import_summary.json`

## Command

```bash
npm run import:decisions
```

Optional custom input path:

```bash
npm run import:decisions -- --file content/logs/workflows/mission_control_decisions.json
```
