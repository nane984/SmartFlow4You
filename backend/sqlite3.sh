#!/usr/bin/env bash
# Official sqlite3 CLI (project-local binary, no sudo required).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
BIN="${ROOT}/tools/sqlite3"
DB="${ROOT}/smartflow/db.sqlite3"

if [[ ! -x "$BIN" ]]; then
  echo "sqlite3 binary missing. Download from https://www.sqlite.org/download.html into backend/tools/" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  exec "$BIN" "$DB"
fi

exec "$BIN" "$@"
