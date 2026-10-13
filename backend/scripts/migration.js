// Run in the operator's terminal. No connection data are written to stdout/argv.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { MongoClient } = require('mongoose').mongo;
const { EJSON } = require('bson');

function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
    return value;
}
function readConfig(path) {
    const permissions = fs.statSync(path).mode & 0o777;
    if (permissions & 0o077) throw new Error('Connection config must be mode 600');
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));
    if (typeof config.uri !== 'string' || !/^mongodb(?:\+srv)?:\/\//.test(config.uri)) throw new Error('Invalid connection config');
    return config;
}
async function snapshot(configPath, database) {
    const client = new MongoClient(readConfig(configPath).uri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        const db = client.db(database);
        const collections = await db.listCollections({}, { nameOnly: false }).toArray();
        if (collections.some(c => !c.name.startsWith('system.') && c.name !== 'forms')) throw new Error('Unexpected collection; review migration scope');
        const forms = collections.find(c => c.name === 'forms');
        const hash = crypto.createHash('sha256');
        let count = 0;
        for await (const document of db.collection('forms').find({}, { promoteValues: false }).sort({ _id: 1 })) {
            hash.update(JSON.stringify(canonical(EJSON.serialize(document, { relaxed: false }))) + '\n');
            count++;
        }
        const indexes = forms ? (await db.collection('forms').indexes()).map(({ v, ns, key, ...index }) => canonical({ ...index, key: Object.entries(key) })).sort((a, b) => a.name.localeCompare(b.name)) : [];
        return { count, sha256: hash.digest('hex'), indexes, options: canonical(forms?.options || {}) };
    } finally { await client.close(); }
}
function dbName(value) {
    if (!/^[a-zA-Z0-9_-]+$/.test(value || '') || ['admin', 'local', 'config'].includes(value)) throw new Error('Invalid database name');
    return value;
}
function runTools(command, args) {
    const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    // Tools may include connection secrets in errors. Report status only.
    if (result.error || result.status !== 0) throw new Error(`${command} failed; verify configuration and tool compatibility`);
}
async function main(argv) {
    const [action, ...args] = argv;
    const options = {};
    for (let i = 0; i < args.length; i++) {
        if (!args[i].startsWith('--')) throw new Error('Expected named option');
        options[args[i].slice(2)] = args[i] === '--writes-stopped' ? true : args[++i];
    }
    const sourceDb = dbName(options['source-db']);
    const manifestPath = options.manifest;
    if (action === 'inspect') {
        const source = await snapshot(options['source-config'], sourceDb);
        console.log(JSON.stringify({ forms: source.count, indexes: source.indexes.length }));
        return;
    }
    if (action === 'dump') {
        if (!manifestPath) throw new Error('--manifest required');
        if (!options['writes-stopped']) throw new Error('--writes-stopped required after stopping all source writers');
        if (!options.archive || fs.existsSync(options.archive) || fs.existsSync(manifestPath)) throw new Error('Use new archive and manifest paths');
        readConfig(options['source-config']);
        const before = await snapshot(options['source-config'], sourceDb);
        if (!before.count) throw new Error('Source forms collection is empty; refusing an empty migration');
        const oldMask = process.umask(0o077);
        try {
            runTools('mongodump', [`--config=${options['source-config']}`, `--db=${sourceDb}`, '--collection=forms', `--archive=${options.archive}`, '--gzip']);
            const after = await snapshot(options['source-config'], sourceDb);
            if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Source changed during dump');
            fs.writeFileSync(manifestPath, JSON.stringify({ sourceDb, forms: after }, null, 2), { flag: 'wx', mode: 0o600 });
        } finally { process.umask(oldMask); }
        console.log('Dump and source fingerprint complete');
        return;
    }
    const targetDb = dbName(options['target-db']);
    if (!manifestPath) throw new Error('--manifest required');
    if (targetDb === 'test') throw new Error('Target must use a dedicated database, never test');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.sourceDb !== sourceDb) throw new Error('Source database does not match manifest');
    if (action === 'restore') {
        const targetUri = readConfig(options['target-config']).uri;
        const authority = targetUri.replace(/^mongodb(?:\+srv)?:\/\//, '').split('/')[0].split('@').pop();
        if (authority.split(',').some(h => !['localhost', '127.0.0.1', 'mongo'].includes(h.split(':')[0]))) throw new Error('Restore target must be local or compose mongo');
        if ((await snapshot(options['target-config'], targetDb)).count !== 0) throw new Error('Target is not empty; no --drop or overwrite is supported');
        runTools('mongorestore', [`--config=${options['target-config']}`, `--archive=${options.archive}`, '--gzip', `--nsInclude=${sourceDb}.forms`, `--nsFrom=${sourceDb}.forms`, `--nsTo=${targetDb}.forms`, '--stopOnError']);
    } else if (action !== 'verify') throw new Error('Use inspect, dump, restore or verify');
    const target = await snapshot(options['target-config'], targetDb);
    if (JSON.stringify(manifest.forms) !== JSON.stringify(target)) throw new Error('Target documents, indexes or options differ from source fingerprint');
    console.log(`Verified ${target.count} forms: BSON content, IDs, indexes and collection options match`);
}
if (require.main === module) main(process.argv.slice(2)).catch(error => {
    const safeMessage = /^(Connection config must|Invalid connection config|Unexpected collection|Invalid database name|Expected named option|--manifest required|--writes-stopped required|Use new archive|Source forms collection|Source changed during dump|Target must use|Source database does not match|Restore target must|Target is not empty|Target documents|Use inspect|mongodump failed|mongorestore failed)/.test(error.message);
    console.error(safeMessage ? `Migration failed: ${error.message}` : 'Migration failed: check connection configuration and MongoDB availability');
    process.exitCode = 1;
});
module.exports = { snapshot, main };
