#!/usr/bin/env bash
set -o errexit
cd "$(dirname "$0")"
PY="${PYTHON_BIN:-python3}"
exec $PY -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8100}"
