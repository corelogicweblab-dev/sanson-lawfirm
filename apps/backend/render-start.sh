#!/usr/bin/env bash
# Used when Render rootDir is repo root (npm run start:prod)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/apps/backend"
exec bash start.sh
