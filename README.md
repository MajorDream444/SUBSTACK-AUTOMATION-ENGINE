# SUBSTACK-AUTOMATION-ENGINE

The Substack Automation Engine turns Major Dream Williams' raw thoughts into reusable article packets, GitHub markdown records, Airtable pipeline audits, dry-run publishing reports, video/voice asset prompts, and local daily briefs.

This is a Major AI OS component, not a generic content tool.

## System Stack

- ChatGPT = plans
- Codex = builds
- OpenClaw = runs
- Hanzo = thinks
- GitHub = remembers and remains source of truth
- Airtable = tracks pipeline state
- Notion = shows the human dashboard
- Obsidian + Graphify = connects memory
- n8n = automates workflows
- Substack = broadcasts
- Remotion = programmatic video layer
- HeyGen = avatar video layer
- AI Voice Generator = voiceover layer

## Setup

```bash
npm install
cp .env.example .env
```

Fill only the keys needed for the command you are running. Do not commit `.env`.

## Dry-Run Workflow

1. Add a raw thought to `content/raw/`.
2. Generate an article packet:

```bash
npm run generate:article -- --file content/raw/sample-major-thought.txt --title "Sample Major Thought" --lane "Major AI OS productization"
```

Reaction Doctrine packets can include source metadata:

```bash
npm run generate:article -- --file content/raw/reaction-source.txt --title "Reaction Title" --lane "Reaction Doctrine" --source-url "https://example.com/source" --source-title "Original Source Title"
```

3. Dry-run the Substack publish check:

```bash
npm run publish:dry -- --file content/articles/sample-major-thought.md
```

4. Generate local daily brief:

```bash
npm run brief
```

5. Run Airtable read-only sync:

```bash
npm run sync:airtable
```

Test the Reaction Doctrine Airtable dry-run path with the local fixture:

```bash
npm run sync:airtable -- --fixture content/research/reaction_doctrine_airtable_fixture.json
```

## Future Live Publishing Workflow

When live publishing is built later, Airtable records with `Status = Scheduled` will become automatic publish candidates. Live mode must remain opt-in and must never publish blocked or unmapped content.

## Reaction Doctrine

Reaction Doctrine turns YouTube videos, podcast clips, news segments, and viral cultural moments into system-level commentary. It does not become generic political commentary.

Rules:

- Extract the system underneath the clip.
- Map back to Major AI OS, culture, doctrine, diaspora, media, or leverage.
- Preserve the raw rant/source as original material.
- Publish only the tightened Substack article version.

## Safety Rules

- GitHub is source of truth.
- Never overwrite the original raw thought.
- Never publish unmapped content.
- Default publishing to dry-run.
- Do not add secrets.
- Do not invent API keys.
- Do not call external APIs unless matching keys are configured.
- Every output must be logged.
- Every agent leaves a handoff.
