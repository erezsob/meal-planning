#!/usr/bin/env bash
# Run a command with a usable Playwright browser cache.
# Cursor sets PLAYWRIGHT_BROWSERS_PATH to a sandbox folder. That folder is
# missing when the command runs outside the sandbox, so Playwright exits
# before the test starts. Drop the variable and use the normal cache.

set -euo pipefail

browsers_path="${PLAYWRIGHT_BROWSERS_PATH:-}"
if [[ -n "$browsers_path" ]]; then
  shopt -s nullglob
  installed=("$browsers_path"/chromium*)
  if [[ ${#installed[@]} -eq 0 ]]; then
    unset PLAYWRIGHT_BROWSERS_PATH
  fi
fi

exec "$@"
