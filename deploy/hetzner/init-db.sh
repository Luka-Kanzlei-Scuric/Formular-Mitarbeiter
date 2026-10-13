#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Read only the non-secret database name; never source a file as shell code.
database=$(sed -n 's/^MONGODB_DB_NAME=//p' .env)
[[ "$database" =~ ^[a-zA-Z0-9_-]+$ ]] || { echo 'Set MONGODB_DB_NAME in .env'; exit 1; }
docker compose up -d mongo
for _attempt in {1..30}; do
  if docker compose exec -T -e MONGODB_DB_NAME="$database" mongo mongosh --quiet --nodb /opt/formular/init.js; then
    exit 0
  fi
  sleep 2
done
echo 'Database initialization failed' >&2
exit 1
