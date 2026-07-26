# Production Deployment

## URLs

| Service  | URL                                 |
| -------- | ----------------------------------- |
| Frontend | https://plan.sick-meals.workers.dev |
| Convex   | See `.env.production` for URL       |

## Architecture

```
Browser → Cloudflare Access (auth) → Cloudflare Workers (frontend) → Convex (backend)
```

## Environments

| Environment | Convex Deployment                | Frontend                    |
| ----------- | -------------------------------- | --------------------------- |
| Development | `CONVEX_DEPLOYMENT` in .env      | localhost:3000              |
| Production  | `CONVEX_DEPLOYMENT_PROD` in .env | plan.sick-meals.workers.dev |

## Deploy to production

Use the combined deploy script to push backend and frontend together:

```bash
pnpm deploy:prod
```

This runs, in order:

1. **Pre-deploy checks** — Biome, TypeScript, Knip (`pnpm check:full`)
2. **Frontend build** — `pnpm build` (loads `.env.production`)
3. **Parallel deploy** — Convex and Cloudflare Workers at the same time
   - `convex deploy` — schema and server functions
   - `wrangler deploy` — Workers frontend

Both deploy steps must succeed; if either fails, the script exits with an error.

### Prerequisites

- Logged into Convex CLI (`pnpm exec convex login`)
- Logged into Cloudflare (`pnpm exec wrangler login`)
- `.env.production` with prod `VITE_CONVEX_URL` (see below)

### Deploy frontend or backend only

```bash
# Cloudflare Workers only (assumes dist/ already built)
pnpm deploy

# Convex only
pnpm exec convex deploy
```

## Backend (Convex)

```bash
# Push schema/functions to prod
pnpm exec convex deploy

# Seed prod data
pnpm exec convex run seed:seedDishes --prod

# Clear prod data
pnpm exec convex run seed:clearDishes --prod

# Open prod dashboard
pnpm exec convex dashboard --prod
```

## Frontend (Cloudflare Workers)

```bash
# Build and deploy
pnpm build && pnpm deploy
```

## Environment Files (gitignored)

Create these files locally:

**`.env.local`** (for local dev):

```
CONVEX_DEPLOYMENT=dev:<your-dev-deployment>
VITE_CONVEX_URL=https://<your-dev-deployment>.convex.cloud
```

**`.env.production`** (for prod builds):

```
VITE_CONVEX_URL=https://<your-prod-deployment>.convex.cloud
```

Vite automatically loads `.env.production` during `pnpm build`.

## Access Control

Auth is handled via Cloudflare Zero Trust Access:

- Dashboard: https://one.dash.cloudflare.com/
- Path: Access → Applications
- Domain: plan.sick-meals.workers.dev
- Policy: Email allowlist

## Worker Management

```bash
# Verify Cloudflare auth
pnpm exec wrangler whoami

# Delete unused workers
pnpm exec wrangler delete <worker-name>
```
