# Codex Workflow

## How Codex Should Work Here

1. Read `SYSTEM_CORE.md`.
2. Inspect the current repo state.
3. Make the smallest useful fix or build step.
4. Run the matching command.
5. Log the result.
6. Leave a handoff.

Do not rebuild the whole system if a smaller fix works.

## Commands

```bash
npm run build
npm run generate:article -- --file content/raw/sample-major-thought.txt --title "Sample Major Thought" --lane "Major AI OS productization"
npm run publish:dry -- --file content/articles/sample-major-thought.md
npm run brief
npm run sync:airtable
```

## Verification

Before committing:

```bash
npm run build
npm run generate:article -- --file content/raw/sample-major-thought.txt --title "Sample Major Thought" --lane "Major AI OS productization"
npm run publish:dry -- --file content/articles/sample-major-thought.md
npm run brief
npm run sync:airtable
```

Confirm `.env`, `.auth`, logs with secrets, and generated credentials are not committed.

## Commit Instructions

- Keep commits scoped to the phase or workflow.
- Commit generated scaffold outputs that document verification.
- Push to `main` only after verification passes.
