# Meal Planner

Weekly meal planning app with a simple week-plan grid, recipe library, and shopping support.

## Features

- **Week Plan** - simple Sat-Friday free-text planning grid with grocery notes
- **Recipe Library** - dish management with ingredients, tags, servings
- **Meal Logging & History** - flexible logging by date and meal slot with historical browsing
- **Shopping List** - ingredient aggregation from planned dish data

## Tech Stack

- TanStack Start (React 19, file-based routing)
- Convex (real-time backend)
- Tailwind CSS v4
- TypeScript strict mode
- Cloudflare Workers (deploy)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev servers (Vite + Convex)
pnpm dev

# Seed sample dishes
pnpm seed
```

Requires `VITE_CONVEX_URL` env var (set automatically by `convex dev`).

## Scripts

| Command            | Description                     |
| ------------------ | ------------------------------- |
| `pnpm dev`         | Start Vite + Convex dev servers |
| `pnpm build`       | Production build                |
| `pnpm deploy`      | Deploy to Cloudflare Workers    |
| `pnpm lint`        | Biome lint check                |
| `pnpm types:check` | TypeScript check                |
| `pnpm test`        | Run tests                       |
| `pnpm seed`        | Seed sample dishes              |

## Project Structure

```
convex/          # Backend schema + functions
lib/             # Shared utils + UI primitives
src/routes/      # File-based routes (/, /library, /shopping)
src/components/  # Feature components
.docs/           # Project documentation
```

## Documentation

- [Architecture](.docs/ARCHITECTURE.md) - system design, data model
- [Code Standards](.docs/CODE_STANDARDS.md) - coding conventions
- [Testing](.docs/TESTING.md) - test guidelines
- [Future Plans](.docs/FUTURE_PLANS.md) - roadmap
