#!/usr/bin/env python3
"""Create new-host secrets without printing them. Never overwrite existing secrets."""
import argparse
import os
from pathlib import Path
import secrets

parser = argparse.ArgumentParser()
parser.add_argument('--test', action='store_true', help='Synthetic local compose smoke test only')
args = parser.parse_args()
root = Path(__file__).resolve().parent
settings = {}
for line in (root / '.env').read_text().splitlines():
    if line.strip() and not line.lstrip().startswith('#'):
        key, value = line.split('=', 1)
        settings[key] = value
if args.test and settings.get('APP_ENV') not in ('test', 'staging'):
    raise SystemExit('--test requires test/staging')
if not args.test and os.geteuid() != 0:
    raise SystemExit('Run as root on the new host; secret ownership must match container uid 1000')
db = settings.get('MONGODB_DB_NAME', 'formular')
if not db.replace('-', '').replace('_', '').isalnum() or db in ('admin', 'local', 'config', 'test'):
    raise SystemExit('Use a dedicated database name')
directory = root / 'secrets'
directory.mkdir(mode=0o700, exist_ok=True)
if any(directory.iterdir()):
    raise SystemExit('Secret directory is not empty; refusing to overwrite or mix credentials')
password = secrets.token_hex(32)
values = {
    'mongo-admin-password': secrets.token_hex(32),
    'mongo-keyfile': secrets.token_urlsafe(512).replace('-', 'A').replace('_', 'B'),
    'mongo-app-password': password,
    'mongo-app-uri': f'mongodb://formular:{password}@mongo:27017/{db}?authSource={db}&replicaSet=rs0',
    'auth-secret': secrets.token_hex(48),
    'staff-password': secrets.token_urlsafe(24),
    'integration-key': secrets.token_hex(32),
    'make-update-url': '',
    'make-pkonto-url': '',
}
backend_files = {'mongo-app-uri', 'auth-secret', 'staff-password', 'integration-key', 'make-update-url', 'make-pkonto-url'}
for name, value in values.items():
    path = directory / name
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, 'w') as handle:
        handle.write(value + '\n')
    if args.test:
        os.chmod(path, 0o644)  # Synthetic test values only; removed after the smoke test.
    elif name in backend_files:
        os.chown(path, 0, 1000)
        os.chmod(path, 0o640)
print('Secrets created. Values were not printed. Store staff/integration credentials in the password manager.')
