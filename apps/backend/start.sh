#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

PYTHON_BIN=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done

if [ -z "$PYTHON_BIN" ]; then
  echo "FATAL: python3/python not found on PATH" >&2
  exit 1
fi

PORT="${PORT:-8100}"
echo "Starting SANSON API on 0.0.0.0:${PORT} (${PYTHON_BIN})" >&2

exec "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --timeout-keep-alive 75
