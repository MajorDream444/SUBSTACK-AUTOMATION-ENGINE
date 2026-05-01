# Agent Operating Rules

Always read `SYSTEM_CORE.md` first.

## Behavior

- Work inside the Major AI OS operating sentence.
- Keep changes modular and workflow-driven.
- Build the automation engine, not random content tools.
- Preserve raw thoughts exactly.
- Treat GitHub markdown as the durable source of truth.
- Treat Command Center as the authority.
- Do not build Mission Control UI, global approval UI, or duplicate Command Center logic.

## Handoffs

Every task must leave a handoff in `docs/HANDOFF.md` or `content/logs/agents/`.

Include:

- what changed
- commands run
- verification results
- known gaps
- next recommended task

## Content Safety

- No unmapped content can publish.
- If lane is missing or invalid, set status to `blocked`.
- Reaction Doctrine must extract the system underneath the source and must not become generic political commentary.
- Reaction Doctrine preserves raw rant/source material and publishes only the tightened version.
- Nothing publishes without Mission Control approval unless `publish_mode = auto` and Command Center later enables auto rules.
- Mission Control `publish_requested` decisions run dry-run publishing only.
- Asset generation is dry-run only and must not call external APIs.
- Do not expose or log secrets.
- Do not add real credentials to repo files.

## Daily Brief

Every meaningful run should update or generate a daily brief under `content/logs/daily/`.
