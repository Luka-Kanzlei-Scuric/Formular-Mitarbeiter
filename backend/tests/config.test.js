const test = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../config/runtime');
const base = { APP_ENV: 'test', FRONTEND_URL: 'http://localhost:3000', MONGODB_URI: 'mongodb://127.0.0.1:27017/formular-test',
    MONGODB_DB_NAME: 'formular-test', AUTH_SECRET: 'a'.repeat(48), STAFF_PASSWORD: 'synthetic-password', INTEGRATION_API_KEY: 'b'.repeat(48) };
test('test/staging reject external databases and production webhooks', () => {
    assert.throws(() => loadConfig({ ...base, MONGODB_URI: 'mongodb+srv://atlas.example.com/test' }));
    assert.throws(() => loadConfig({ ...base, MAKE_WEBHOOKS_ENABLED: 'true', MAKE_UPDATE_WEBHOOK_URL: 'https://hook.eu2.make.com/test', MAKE_PKONTO_WEBHOOK_URL: 'https://hook.eu2.make.com/test' }));
    assert.equal(loadConfig(base).webhooksEnabled, false);
    assert.equal(loadConfig(base).trustProxy, false);
});
test('reject incomplete secrets and unsafe origins', () => {
    assert.throws(() => loadConfig({ ...base, AUTH_SECRET: '' }));
    assert.throws(() => loadConfig({ ...base, INTEGRATION_API_KEY: '' }));
    assert.throws(() => loadConfig({ ...base, CORS_ORIGINS: '*' }));
    assert.throws(() => loadConfig({ ...base, FRONTEND_URL: 'http://localhost/form' }));
    assert.throws(() => loadConfig({ ...base, APP_ENV: 'production' }));
});
module.exports = { base };
