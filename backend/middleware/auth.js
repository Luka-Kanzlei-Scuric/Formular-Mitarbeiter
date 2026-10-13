const crypto = require('node:crypto');
const { rateLimit } = require('express-rate-limit');
const digest = value => crypto.createHash('sha256').update(value).digest();
const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && crypto.timingSafeEqual(digest(a), digest(b));
function createAuth(config) {
    const ttl = config.tokenTtlHours * 60 * 60 * 1000;
    const sign = payload => crypto.createHmac('sha256', config.authSecret).update(payload).digest('base64url');
    const verify = token => {
        if (typeof token !== 'string' || token.length > 2048) return false;
        const parts = token.split('.');
        if (parts.length !== 2 || !parts.every(Boolean) || !safeEqual(parts[1], sign(parts[0]))) return false;
        try {
            const { exp } = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
            return Number.isFinite(exp) && exp > Date.now() && exp <= Date.now() + ttl;
        } catch { return false; }
    };
    return {
        loginLimit: rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, skipSuccessfulRequests: true, standardHeaders: 'draft-7', legacyHeaders: false,
            message: { message: 'Zu viele Versuche. Bitte später erneut versuchen.' } }),
        login(req, res) {
            if (!safeEqual(req.body?.password, config.staffPassword)) return res.status(401).json({ message: 'Passwort falsch' });
            const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ttl })).toString('base64url');
            res.json({ token: `${payload}.${sign(payload)}`, expiresIn: ttl });
        },
        requireAuth(req, res, next) {
            if (safeEqual(req.get('X-API-Key'), config.integrationKey)) return next();
            const header = req.get('Authorization') || '';
            if (header.startsWith('Bearer ') && verify(header.slice(7))) return next();
            res.status(401).json({ message: 'Nicht angemeldet' });
        },
    };
}
module.exports = { createAuth };
