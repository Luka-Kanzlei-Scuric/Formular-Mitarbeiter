#!/usr/bin/env bash
set -euo pipefail
# Docker Compose file secrets may be bind-mounted with host permissions.
install -o mongodb -g mongodb -m 400 /run/secrets/mongo_keyfile /tmp/formular-mongo-keyfile
exec /usr/local/bin/docker-entrypoint.sh mongod --replSet rs0 --keyFile /tmp/formular-mongo-keyfile --bind_ip_all --wiredTigerCacheSizeGB 2
