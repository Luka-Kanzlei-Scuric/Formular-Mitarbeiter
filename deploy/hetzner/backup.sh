#!/usr/bin/env bash
# Stream a consistent full replica-set dump directly to encrypted restic storage.
set -euo pipefail
cd "$(dirname "$0")"
[[ -n "${RESTIC_REPOSITORY:-}" && -n "${RESTIC_PASSWORD_FILE:-}" ]] || { echo 'Set RESTIC_REPOSITORY and RESTIC_PASSWORD_FILE'; exit 1; }
exec 9>/tmp/formular-backup.lock
flock -n 9 || { echo 'Backup already running'; exit 1; }
# No password appears in argv, docker inspect or host environment.
restic backup --stdin-from-command --stdin-filename formular-mongo.archive.gz --tag formular-mongo -- \
  docker compose exec -T mongo bash /opt/formular/dump.sh
# Do not prune on every backup; retain separate daily/monthly policy and monitoring.
