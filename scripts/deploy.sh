#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Running pre-deploy checks..."
pnpm check:full

if [[ ! -f .env.production ]]; then
	echo "ERROR: .env.production is missing (needs VITE_CONVEX_URL for the prod build)."
	exit 1
fi

echo "==> Building frontend..."
pnpm build

echo "==> Deploying Convex and Cloudflare Workers in parallel..."

status=0

pnpm exec convex deploy --yes &
convex_pid=$!

pnpm run deploy &
wrangler_pid=$!

if ! wait "$convex_pid"; then
	echo "ERROR: Convex deploy failed."
	status=1
fi

if ! wait "$wrangler_pid"; then
	echo "ERROR: Cloudflare deploy failed."
	status=1
fi

if [[ "$status" -ne 0 ]]; then
	exit "$status"
fi

echo "==> Deploy complete."
echo "    Frontend: https://plan.sick-meals.workers.dev"
echo "    Convex:   see .env.production (VITE_CONVEX_URL)"
