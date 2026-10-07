## System primitives

Compose documented primitives before inventing local equivalents. See [docs/PRIMITIVES.md](docs/PRIMITIVES.md) for the composition contract (UI, data/API, platform workflows, trust boundaries). The machine-readable map is [docs/contributing/architecture/primitives.yaml](docs/contributing/architecture/primitives.yaml) — use it for path-to-primitive mapping and PR visual-recap classification; keep it in sync with `PRIMITIVES.md` when adding or reshaping primitives.

## Agent skills

### Issue tracker

GitHub Issues via `gh`; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Product docs

Implementation references live in `.docs/`. `docs/` is agent workflow and domain decisions.

| When | Read |
| --- | --- |
| Standards, review checklist | `.docs/CODE_STANDARDS.md` |
| Where code lives, routes, Convex modules | `.docs/ARCHITECTURE.md` |
| Week-plan behavior | `.docs/WEEK_PLAN.md` |
| Production deploy | `.docs/DEPLOYMENT.md` |
| Tests | `.docs/TESTING.md` |
