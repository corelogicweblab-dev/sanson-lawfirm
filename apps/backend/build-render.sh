#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
echo "[build-render] Python dependencies..."
pip install -r requirements.txt
pip show email-validator >/dev/null

REPO_ROOT="$(cd ../.. && pwd)"
if [ -d "$REPO_ROOT/apps/web" ]; then
  echo "[build-render] Building web static export..."
  cd "$REPO_ROOT"
  npm ci --omit=dev 2>/dev/null || npm install
  npm run build:web
  rm -rf apps/backend/static_web
  cp -R apps/web/out apps/backend/static_web
  echo "[build-render] static_web copied ($(find apps/backend/static_web -type f | wc -l) files)"
fi
