# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is single-context. There is no `GLOSSARY-MAP.md`.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root
- **`docs/adr/`** — decisions that touch the area you are about to work in:
  - `0001-manual-archive-previous-week.md`
  - `0002-pwa-first-phone-install.md`

Week-plan behavior beyond the glossary is `.docs/WEEK_PLAN.md` (see `AGENTS.md`).

If a glossary or ADR is missing, proceed silently. Don't flag the absence or suggest creating one upfront. The `domain-modeling` skill (reached via `grill-with-docs` and `improve-codebase-architecture`) creates them when terms or decisions actually get resolved.

## File structure

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-manual-archive-previous-week.md
│   └── 0002-pwa-first-phone-install.md
└── src/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (manual archive of previous week), but worth reopening because…_
