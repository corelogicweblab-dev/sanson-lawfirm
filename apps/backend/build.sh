#!/usr/bin/env bash
set -o errexit
cd "$(dirname "$0")"
PY="${PYTHON_BIN:-python3}"
$PY -m pip install --upgrade pip
$PY -m pip install -r requirements.txt
