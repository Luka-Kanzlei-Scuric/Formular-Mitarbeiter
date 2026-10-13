#!/usr/bin/env bash
set -euo pipefail
umask 077
config=$(mktemp)
trap 'rm -f "$config"' EXIT
mongosh --quiet --nodb /opt/formular/admin-config.js > "$config"
if ! mongodump --config="$config" --archive --gzip --oplog --quiet 2>/dev/null; then
  echo 'Mongo dump failed' >&2
  exit 1
fi
