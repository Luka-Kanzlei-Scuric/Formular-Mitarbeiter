const fs = require('node:fs');
function secret(env, name) {
    if (env[name] && env[`${name}_FILE`]) throw new Error(`Set only ${name} or ${name}_FILE`);
    return env[`${name}_FILE`] ? fs.readFileSync(env[`${name}_FILE`], 'utf8').trim() : (env[name] || '');
}
function loadConfig(env = process.env) {
    const environment = env.APP_ENV || 'development';
    if (!['development', 'test', 'staging', 'production'].includes(environment)) throw new Error('Invalid APP_ENV');
    const config = {
        environment, port: Number(env.PORT || 5001),
        mongoUri: secret(env, 'MONGODB_URI'), mongoDb: env.MONGODB_DB_NAME || 'formular',
        frontendUrl: env.FRONTEND_URL || '', authSecret: secret(env, 'AUTH_SECRET'),
        staffPassword: secret(env, 'STAFF_PASSWORD'), integrationKey: secret(env, 'INTEGRATION_API_KEY'),
        tokenTtlHours: Number(env.AUTH_TOKEN_TTL_HOURS || 12),
        corsOrigins: (env.CORS_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean),
        trustProxy: env.TRUST_PROXY || false, maintenance: env.MAINTENANCE_MODE === 'true',
        webhooksEnabled: env.MAKE_WEBHOOKS_ENABLED === 'true',
        updateWebhook: secret(env, 'MAKE_UPDATE_WEBHOOK_URL'), pkontoWebhook: secret(env, 'MAKE_PKONTO_WEBHOOK_URL'),
        release: env.RELEASE_SHA || 'local',
    };
    if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) throw new Error('Invalid PORT');
    if (!/^mongodb(?:\+srv)?:\/\//.test(config.mongoUri)) throw new Error('MONGODB_URI is required');
    if (!/^[a-zA-Z0-9_-]+$/.test(config.mongoDb) || ['admin', 'local', 'config'].includes(config.mongoDb)) throw new Error('Invalid MONGODB_DB_NAME');
    if (config.authSecret.length < 32 || config.staffPassword.length < 12 || config.integrationKey.length < 32) throw new Error('AUTH_SECRET / INTEGRATION_API_KEY need 32 characters; STAFF_PASSWORD needs 12');
    if (!Number.isFinite(config.tokenTtlHours) || config.tokenTtlHours < 0.25 || config.tokenTtlHours > 24) throw new Error('Invalid AUTH_TOKEN_TTL_HOURS');
    if (!/^https?:\/\//.test(config.frontendUrl)) throw new Error('FRONTEND_URL is required');
    const frontend = new URL(config.frontendUrl);
    if (frontend.username || frontend.password || frontend.search || frontend.hash || frontend.pathname !== '/') throw new Error('FRONTEND_URL must be an origin');
    config.frontendUrl = frontend.origin;
    for (const origin of config.corsOrigins) if (origin.includes('*') || new URL(origin).origin !== origin) throw new Error('CORS_ORIGINS must contain exact origins');
    if (environment === 'production' && frontend.protocol !== 'https:') throw new Error('Production FRONTEND_URL requires HTTPS');
    if (environment !== 'production') {
        const authority = config.mongoUri.replace(/^mongodb(?:\+srv)?:\/\//, '').split('/')[0].split('@').pop();
        const hosts = authority.split(',').map(host => host.split(':')[0]);
        if (hosts.some(host => !['localhost', '127.0.0.1', 'mongo'].includes(host))) throw new Error('Non-production MongoDB must be local or compose mongo');
    }
    if (config.webhooksEnabled) for (const value of [config.updateWebhook, config.pkontoWebhook]) {
        if (!value) throw new Error('Both MAKE webhook URLs are required when enabled');
        const url = new URL(value);
        if (url.username || url.password) throw new Error('Webhook URL must not contain credentials');
        if (environment !== 'production' && (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', 'make-stub'].includes(url.hostname))) throw new Error('Non-production webhooks must use a local stub');
        if (environment === 'production' && (url.protocol !== 'https:' || !/^hook\.[a-z0-9-]+\.make\.com$/.test(url.hostname))) throw new Error('Production webhook must use HTTPS on Make');
    }
    return config;
}
module.exports = { loadConfig };
