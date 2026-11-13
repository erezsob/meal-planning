#!/usr/bin/env bash
# Cursor stop hook: block completion when UI files changed without a passing e2e run.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

if node "$ROOT/.cursor/hooks/check-e2e-stamp.mjs"; then
  exit 0
fi

message="UI files changed and pnpm test:e2e has not passed for this diff. With Convex up, run pnpm test:e2e (it reuses pnpm dev). For layout or motion, also check the page with user-chrome-devtools. See .cursor/rules/ui-verification.mdc."

printf '%s\n' "$(node -e 'console.log(JSON.stringify({ followup_message: process.argv[1] }))' "$message")"
exit 2
