# Formular on Hetzner

This stack is separate from the InsoCore portal. It runs the employee form, its Express API,
and an authenticated single-node MongoDB replica set. Caddy serves the SPA and preserves the
`/api` prefix when proxying to the API. Only Caddy publishes ports. A single node is **not HA**.

The feature branch is based on upstream `34087f1` and includes the earlier local authentication
commit. Do not deploy this directly over the existing Render service: authentication, the
explicit database name and Make configuration must be changed together with the integrations.

## Before production

- Confirm the current source MongoDB version and FCV, actual database (expected `test`),
  collection scope, indexes, data size and every writer, including Make scenarios.
- Pick the owned form domain and configure old Vercel links to redirect with their paths intact.
  `formular-mitarbeiter.vercel.app` cannot be transferred as an owned DNS domain.
- Verify staging using invented records and disabled Make delivery or a local stub.
- Rotate the two webhook URLs previously exposed in the public repository.
- Confirm the pricing rule. Frontend and backend still use their existing different formulas.
  The move does not reinterpret existing prices. This remains a release blocker until resolved.
- Choose the required outage/recovery targets, backup destination and restore operator.

## New host

Use a dedicated production server in Germany, Docker Compose v2 and Node 24 images. Establish
restricted SSH, a host/cloud firewall and an encrypted, persistent Mongo data path first.
The initial size estimate is 4 vCPU / 8 GB; verify it against the actual source size and usage.
The repository does not format disks or provision a server.

Check out the reviewed release into `/opt/formular`, then:

```bash
cd /opt/formular/deploy/hetzner
cp .env.example .env
# Edit non-secret settings:
# APP_ENV=production
# FORMULAR_DOMAIN=<owned-form-domain>
# FRONTEND_URL=https://<owned-form-domain>
# HTTP_BIND=0.0.0.0 / HTTP_PORT=80
# HTTPS_BIND=0.0.0.0 / HTTPS_PORT=443
# MONGODB_DB_NAME=formular
# MONGO_IMAGE=<source-compatible versioned Mongo image>
# MONGO_DATA_PATH=<mounted encrypted data path>
# RELEASE_SHA=<reviewed full git SHA>
# MAINTENANCE_MODE=true / MAKE_WEBHOOKS_ENABLED=false
sudo python3 init-secrets.py
sudo bash init-db.sh
docker compose build backend web tools
docker compose up -d backend web
```

`init-secrets.py` creates new-host secrets and refuses to overwrite an existing directory. The
application URI uses a dedicated `formular` user with `readWrite` only on the form database.
App-readable files are root:1000, mode 640; Mongo administrator files remain root-only.
No credential is printed. Store the employee password and integration key in the password manager.
File secrets are mounted at runtime, never copied into images. Only `--test` for invented local
data permits world-readable fixture files; **never use that switch for production**.

`init-db.sh` initializes the replica set and two indexes before the backend starts. Initialization
does not rotate existing users or delete existing data. Do not change the database name afterwards
without deliberately provisioning and migrating it.

## Transfer the existing database

Run this as the operator on the **new production server**, never against staging. No production
database was accessed during development. Atlas access remains an operator action.

Create `migration/` with mode 700. In it, create `source.json` and `target.json`, mode 600:
`{"uri":"<connection-string>"}`. JSON is also valid YAML for the MongoDB tools' `--config` option.
The source must point to the form's Atlas cluster, **not the portal's cluster**. The target points
to local `mongo:27017`, authenticating as the new admin in `admin`, with `replicaSet=rs0`.
Use a protected editor; never put secrets in shell command arguments or paste them into chat.
Allow the new server IP in Atlas only for this transfer, and remove the rule afterwards.

```bash
docker compose run --rm -T tools inspect \
  --source-config /work/source.json --source-db test
```

The tool expects only the `forms` collection. It refuses unexpected collections so that scope
cannot silently exclude data. If the real database contains more collections, review and extend
the scope before proceeding. Match source/target major version or supported FCV; upgrades are a
separate operation. Keep Mongo system users separate; do not copy Atlas `admin`/`local` data.

Pause employee access, incoming Make operations and **all** other source writers. For the current
old code, GET may write prices, so block every old form API request. Preserve queued new leads.
Drain active requests. The new stack remains in maintenance throughout the transfer.

```bash
docker compose run --rm -T tools dump \
  --source-config /work/source.json --source-db test \
  --archive /work/forms.archive.gz --manifest /work/manifest.json --writes-stopped

docker compose run --rm -T tools restore \
  --source-db test --target-config /work/target.json --target-db formular \
  --archive /work/forms.archive.gz --manifest /work/manifest.json

docker compose run --rm -T tools verify \
  --source-db test --target-config /work/target.json --target-db formular \
  --manifest /work/manifest.json
```

Dump compares source content before/after export. Restore accepts only an empty dedicated local
target, never `test`, and never uses `--drop`. Verification compares exact count, a deterministic
EJSON content hash (including `_id`, timestamps and prices), ordered index keys and collection
options. Any mismatch exits nonzero. An interrupted restore may leave partial data; it is not
automatically removed. Investigate before creating another fresh target. Use a new archive and
manifest path for each rehearsal/final dump. Archives contain real personal data: keep them only
on encrypted storage and remove them when no longer required.

## Cutover

Set the new webhook URLs in `secrets/make-update-url` and `secrets/make-pkonto-url`; preserve file
ownership/modes. Set `MAKE_WEBHOOKS_ENABLED=true`. In Make, update incoming API requests to the new
`https://<domain>/api/forms` and send `X-API-Key: <integration-key>`. Never put that key in Vite env.

Configure DNS, `FRONTEND_URL` and old-link redirects. The frontend uses relative `/api` by default;
Vite proxies it to localhost:5001 for local development. For a temporary separately hosted Vercel
build, set the **public build-time** `VITE_BACKEND_URL=https://<new-domain>` and allow the exact
Vercel origin via `CORS_ORIGINS`. Vercel/Render no longer have hardcoded proxy targets in active code.

After source/target verification and a successful backup restore rehearsal, disable maintenance:

```bash
# .env: MAINTENANCE_MODE=false
docker compose up -d backend web
curl --fail https://<domain>/api/health/ready
```

Health returns environment and `RELEASE_SHA`. Staging also has `x-insocore-env: staging`.
Check a test login, one controlled write and the Make scenario execution separately. A stored
form is not proof of Make delivery. The API returns `_integration.status` and persists the latest
`makeDelivery` state; the UI warns on failed/disabled delivery. `accepted` means Make accepted the
request, **not** that an email arrived. There is no automatic retry: an ambiguous timeout must be
reconciled in Make before manually retrying, to prevent duplicate external actions.

Before the first write on Hetzner, rollback can reopen the unchanged source. After any new write,
do not simply switch DNS back to stale Atlas data. Freeze again and transfer the new data, or run
the old application against the new database after compatibility verification. External Make
actions are not undone by database rollback. Keep old services/database inaccessible until the
rollback period has ended; do not decommission them at cutover.

## Backups and monitoring

Install restic (supporting `--stdin-from-command`), configure encrypted off-host storage, initialize
the repository once and place its settings in root-only `/etc/formular-backup.env`:

```text
RESTIC_REPOSITORY=<off-host-sftp-or-object-storage-repository>
RESTIC_PASSWORD_FILE=/etc/formular-restic-password
```

Run `backup.sh` once, then install `formular-backup.service` and `.timer` under `/etc/systemd/system/`
and enable the timer. The script backs up the **full** replica set with `--oplog`; no DB filter is
combined with oplog capture. If the dump command fails, restic must not create a successful snapshot.
Configure separate retention (suggested: 48 hourly and 30 daily snapshots) and alerts for failures,
backup age, disk free space and Mongo readiness. Timer installation does not configure alerts.

Restore rehearsals use a separate isolated Mongo instance with a matching version: retrieve the
archive via `restic restore`, then run `mongorestore --config=<protected-local-target-config>
--archive=<restored-archive> --gzip --oplogReplay`. Restore the entire archive without namespace
filters/renames because oplog replay requires that. Check records, indexes and login before
declaring the backup recoverable. Never rehearse into the live Mongo instance. Keep a copy of
the backup key outside the server. Hetzner snapshots are additional protection, not Mongo backups;
attached Hetzner volumes are excluded, and running snapshots do not guarantee consistency.

## Validation and remaining limits

`npm test` in `backend/` runs auth/config tests; the real-Mongo test skips without an explicit
synthetic database. To run it against a dedicated local `formular-test` compose deployment:

```bash
docker compose run --rm -T -v ../../backend/tests:/app/tests:ro \
  -e TEST_MONGODB_URI_FILE=/run/secrets/mongo_app_uri \
  -e TEST_MONGODB_DB_NAME=formular-test backend node --test tests/integration.test.js
```

That test only accepts a database named `formular-test` (or its test suffix) and deliberately
clears its invented forms. Never configure production credentials for it.

Production NPM dependencies are clean in the audit at preparation time. The Tailwind 3 build
toolchain still has registry advisories; it is present only in the build stage and local tooling.
Upgrading to Tailwind 4 is a separate UI migration. The runtime frontend image contains only Caddy
and static assets. Node 24 Docker builds, auth/config tests, real-Mongo API integration, Caddy
routes and local BSON transfer are the validation targets. Production TLS issuance, Atlas
connectivity, actual data volume and real Make account configuration need checks on the new host.

Sources: [MongoDB dump](https://www.mongodb.com/docs/database-tools/mongodump/),
[restore](https://www.mongodb.com/docs/database-tools/mongorestore/),
[Caddy SPA/API](https://caddyserver.com/docs/caddyfile/patterns),
[restic command backup](https://restic.readthedocs.io/en/stable/040_backup.html),
[Hetzner backup limits](https://docs.hetzner.com/cloud/servers/backups-snapshots/faq/).
