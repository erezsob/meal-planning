# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is single-context. There is no `CONTEXT-MAP.md`.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary
- **`docs/adr/`** — decisions that touch the area you are about to work in:
  - `0001-manual-archive-previous-week.md`
  - `0002-pwa-first-phone-install.md`

Week-plan behavior beyond the glossary is `.docs/WEEK_PLAN.md` (see `AGENTS.md`).

## File structure

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-manual-archive-previous-week.md
│   └── 0002-pwa-first-phone-install.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Use the terms the glossary prefers.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (manual archive of previous week) — but worth reopening because…_
