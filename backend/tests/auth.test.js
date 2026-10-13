const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { loadConfig } = require('../config/runtime');
const { createApp } = require('../app');
const config = loadConfig({ APP_ENV: 'test', FRONTEND_URL: 'http://localhost:3000', MONGODB_URI: 'mongodb://localhost/formular-test',
    MONGODB_DB_NAME: 'formular-test', AUTH_SECRET: 'a'.repeat(48), STAFF_PASSWORD: 'synthetic-password', INTEGRATION_API_KEY: 'b'.repeat(48) });
async function withServer(config, task) {
    const server = createApp(config).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try { await task(`http://127.0.0.1:${server.address().port}`); }
    finally { await new Promise(resolve => server.close(resolve)); }
}
test('login rejects object passwords, rate limits failures, protects every form route', async () => {
    await withServer(config, async url => {
        for (const [method, path] of [['GET','/search?name=Demo'],['GET','/fake'],['POST','/'],['PUT','/fake'],['POST','/send-pkonto-email']]) {
            assert.equal((await fetch(`${url}/api/forms${path}`, { method })).status, 401);
        }
        for (let i = 0; i < 5; i++) {
            const response = await fetch(`${url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({password: { x: 'synthetic-password' }}) });
            assert.equal(response.status, 401);
        }
        assert.equal((await fetch(`${url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ password: config.staffPassword }) })).status, 429);
    });
});
test('signed login tokens work; altered, expired and extended tokens fail', async () => {
    await withServer(config, async url => {
        const login = await fetch(`${url}/api/auth/login`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ password: config.staffPassword }) });
        const { token } = await login.json();
        const request = auth => fetch(`${url}/api/forms`, { method:'POST', headers: {'Content-Type':'application/json', Authorization:`Bearer ${auth}`}, body:'{}' });
        assert.equal((await request(token)).status, 400); // past auth, rejected by form validation
        assert.equal((await request(token + '.extra')).status, 401);
        assert.equal((await request(token.slice(0,-1) + (token.endsWith('X') ? 'Y' : 'X'))).status, 401);
        const payload = Buffer.from(JSON.stringify({ exp: Date.now() - 1000 })).toString('base64url');
        const signature = crypto.createHmac('sha256',config.authSecret).update(payload).digest('base64url');
        assert.equal((await request(`${payload}.${signature}`)).status,401);
        assert.equal((await fetch(`${url}/api/forms`, { method:'POST', headers:{'Content-Type':'application/json','X-API-Key':config.integrationKey},body:'{}' })).status,400);
    });
});
test('maintenance blocks GET and writes; health reports readiness separately', async () => {
    await withServer({...config,maintenance:true},async url => {
        for (const method of ['GET','POST','PUT']) assert.equal((await fetch(`${url}/api/forms/fake`,{method})).status,503);
        assert.equal((await fetch(`${url}/api/health/live`)).status,200);
        assert.equal((await fetch(`${url}/api/health/ready`)).status,503);
    });
});
test('malformed JSON never echoes the raw input; only exact origins are allowed', async () => {
    await withServer(config,async url => {
        const response = await fetch(`${url}/api/auth/login`, {method:'POST',headers:{'Content-Type':'application/json'},body:'{"private-value":"DO-NOT-ECHO"'});
        assert.equal(response.status,400);
        assert.ok(!(await response.text()).includes('DO-NOT-ECHO'));
        const allowed = await fetch(`${url}/api/auth/login`,{method:'OPTIONS',headers:{Origin:config.frontendUrl,'Access-Control-Request-Method':'POST'}});
        assert.equal(allowed.headers.get('access-control-allow-origin'),config.frontendUrl);
        const denied = await fetch(`${url}/api/health/live`,{headers:{Origin:'https://untrusted.example'}});
        assert.equal(denied.headers.get('access-control-allow-origin'),null);
    });
});
