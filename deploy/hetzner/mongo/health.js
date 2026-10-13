try {
    const password = require('fs').readFileSync('/run/secrets/mongo_admin_password', 'utf8').trim();
    const connection = new Mongo('mongodb://127.0.0.1:27017/?directConnection=true');
    if (!connection.getDB('admin').auth('admin', password)) quit(1);
    if (!connection.getDB('admin').runCommand({ ping: 1 }).ok) quit(1);
    if (!connection.getDB('admin').runCommand({ hello: 1 }).isWritablePrimary) quit(1);
} catch { quit(1); }
