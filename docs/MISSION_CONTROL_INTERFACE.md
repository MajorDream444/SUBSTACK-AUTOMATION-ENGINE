# Mission Control Interface

Command Center is the authority.

`SUBSTACK-AUTOMATION-ENGINE` is an external artifact producer. It creates packets, reports, scripts, briefs, and Mission Control artifact JSON files. It does not provide Mission Control UI, global approval UI, or duplicate Command Center logic.

## Artifact Output

Artifact JSON files are written to:

`content/logs/agents/artifacts/`

File naming:

`<artifact_id>-<slug>.json`

## Artifact Contract

```json
{
  "artifact_id": "uuid",
  "mission_id": "M-XXXXX",
  "artifact_type": "substack_packet | reaction_packet | video_script | publish_report | daily_content_brief",
  "source": "SUBSTACK_ENGINE",
  "status": "draft | ready | needs_review | scheduled | published | blocked",
  "lane": "BWYH | Contour | SAF | Major AI OS | Doctrine | Reaction Doctrine",
  "title": "",
  "source_url": "",
  "github_path": "",
  "airtable_record_id": "",
  "notion_page_id": "",
  "requires_major_review": true,
  "score": 0,
  "confidence": 0,
  "risk_level": "low | medium | high",
  "publish_mode": "auto | review | block | delay",
  "next_action": ""
}
```

## Scoring

- Clarity: 0-20
- Insight: 0-25
- System Depth: 0-25
- Hook Strength: 0-15
- Distribution Fit: 0-15

Total score is 0-100.

## Governance

- High risk always requires Major review.
- High risk cannot use `publish_mode = auto`.
- Medium risk defaults to review.
- Low risk can become auto only if score is at least 85, confidence is at least 80, and risk level is low.
- `delay` is reserved for future use.

## Reaction Doctrine Hard Rule

If lane is `Reaction Doctrine` and the system-underneath section is missing or weak:

- score is capped at 50
- status is `blocked`
- publish_mode is `block`
- requires_major_review is `true`

## Export

Run:

```bash
npm run export:mission-control
```

Outputs:

- `content/logs/workflows/mission_control_export.json`
- `content/logs/workflows/mission_control_export.md`

The export includes total artifacts, counts by status, counts by lane, review counts, blocked counts, auto candidates, and high-risk review requirements.
