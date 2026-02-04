# Production Deployment

## URLs

| Service  | URL                                 |
| -------- | ----------------------------------- |
| Frontend | https://plan.sick-meals.workers.dev |
| Convex   | See `.env.local` for URLs           |

## Architecture

```
Browser → Cloudflare Access (auth) → Cloudflare Workers (frontend) → Convex (backend)
```

## Environments

| Environment | Convex Deployment                | Frontend                    |
| ----------- | -------------------------------- | --------------------------- |
| Development | `CONVEX_DEPLOYMENT` in .env      | localhost:3000              |
| Production  | `CONVEX_DEPLOYMENT_PROD` in .env | plan.sick-meals.workers.dev |

## Deploy Commands

### Backend (Convex)

```bash
# Push schema/functions to prod
npx convex deploy

# Seed prod data
npx convex run seed:seedDishes --prod

# Clear prod data
npx convex run seed:clearDishes --prod

# Open prod dashboard
npx convex dashboard --prod
```

### Frontend (Cloudflare Workers)

```bash
# Build and deploy
pnpm build && pnpm run deploy
```

### Environment Files (gitignored)

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
# List workers
npx wrangler whoami

# Delete unused workers
npx wrangler delete <worker-name>
```
