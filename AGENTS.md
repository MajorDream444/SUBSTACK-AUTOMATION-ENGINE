# Agent Operating Rules

Always read `SYSTEM_CORE.md` first.

## Behavior

- Work inside the Major AI OS operating sentence.
- Keep changes modular and workflow-driven.
- Build the automation engine, not random content tools.
- Preserve raw thoughts exactly.
- Treat GitHub markdown as the durable source of truth.

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
- Do not expose or log secrets.
- Do not add real credentials to repo files.

## Daily Brief

Every meaningful run should update or generate a daily brief under `content/logs/daily/`.
