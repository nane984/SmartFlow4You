#!/usr/bin/env bash
# Interactive SQLite editor for SmartFlow (litecli TUI).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DB="${ROOT}/smartflow/db.sqlite3"
VENV="${ROOT}/.venv/bin/litecli"

if [[ ! -f "$DB" ]]; then
  echo "Database not found: $DB" >&2
  exit 1
fi

if [[ ! -x "$VENV" ]]; then
  echo "Run once: cd backend && python3 -m venv .venv && .venv/bin/pip install litecli" >&2
  exit 1
fi

exec "$VENV" "$DB"
