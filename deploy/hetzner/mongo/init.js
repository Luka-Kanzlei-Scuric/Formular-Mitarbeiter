const fs = require('fs');
const connection = new Mongo('mongodb://127.0.0.1:27017/?directConnection=true');
const admin = connection.getDB('admin');
if (!admin.auth('admin', fs.readFileSync('/run/secrets/mongo_admin_password', 'utf8').trim())) throw new Error('Admin authentication failed');
let status;
try { status = admin.runCommand({ replSetGetStatus: 1 }); }
catch (error) { if (error.code !== 94) throw new Error('Replica set status failed'); status = { code: 94 }; }
if (status.code === 94) {
    const result = admin.runCommand({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: 'mongo:27017' }] } });
    if (!result.ok) throw new Error('Replica set initialization failed');
} else if (!status.ok) throw new Error('Replica set status failed');
let ready = false;
for (let attempt = 0; attempt < 60; attempt++) {
    if (admin.runCommand({ hello: 1 }).isWritablePrimary) { ready = true; break; }
    sleep(1000);
}
if (!ready) throw new Error('Replica set did not become primary');
const name = process.env.MONGODB_DB_NAME;
if (!/^[a-zA-Z0-9_-]+$/.test(name || '') || ['admin', 'local', 'config', 'test'].includes(name)) throw new Error('Dedicated MONGODB_DB_NAME required');
const database = connection.getDB(name);
if (!database.getUser('formular')) database.createUser({ user: 'formular', pwd: fs.readFileSync('/run/secrets/mongo_app_password', 'utf8').trim(), roles: [{ role: 'readWrite', db: name }] });
database.forms.createIndex({ taskId: 1 }, { unique: true });
database.forms.createIndex({ leadName: 1 });
print('Replica set, application user and form indexes ready');
