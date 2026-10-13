const crypto = require('crypto');

// Zugangsschutz für alle /api/forms-Routen.
//
// Zwei Wege hinein:
//  1. Mitarbeiter: Passwort (STAFF_PASSWORD) gegen POST /api/auth/login tauschen,
//     zurück kommt ein signiertes Token (HMAC mit AUTH_SECRET), das als
//     "Authorization: Bearer <token>" mitgeschickt wird.
//  2. Automationen (ClickUp/Make): Header "X-API-Key: <INTEGRATION_API_KEY>".
//
// Fehlt die Konfiguration, wird gesperrt statt durchgelassen.

const TOKEN_TTL_MS = (parseInt(process.env.AUTH_TOKEN_TTL_HOURS, 10) || 12) * 60 * 60 * 1000;

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

// Vergleich in konstanter Zeit, auch bei unterschiedlicher Länge
const safeEqual = (a, b) => crypto.timingSafeEqual(sha256(a), sha256(b));

const sign = (payload) =>
    crypto.createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('base64url');

const issueToken = () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
    return { token: `${payload}.${sign(payload)}`, expiresIn: TOKEN_TTL_MS };
};

const verifyToken = (token) => {
    const [payload, signature] = String(token).split('.');
    if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
    try {
        const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return typeof exp === 'number' && exp > Date.now();
    } catch {
        return false;
    }
};

const isConfigured = () =>
    Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32 && process.env.STAFF_PASSWORD);

// Einfache Begrenzung der Login-Versuche pro IP (im Speicher)
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map();

const tooManyAttempts = (ip) => {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || entry.resetAt < now) return false;
    return entry.count >= MAX_ATTEMPTS;
};

const recordFailure = (ip) => {
    const now = Date.now();
    const entry = attempts.get(ip);
    if (!entry || entry.resetAt < now) {
        attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
        entry.count += 1;
    }
};

exports.login = (req, res) => {
    if (!isConfigured()) {
        console.error('❌ Login nicht möglich: AUTH_SECRET (min. 32 Zeichen) oder STAFF_PASSWORD fehlt');
        return res.status(503).json({ message: 'Anmeldung ist nicht konfiguriert' });
    }

    const ip = req.ip;
    if (tooManyAttempts(ip)) {
        return res.status(429).json({ message: 'Zu viele Versuche. Bitte in 15 Minuten erneut versuchen.' });
    }

    const { password } = req.body || {};
    if (!password || !safeEqual(password, process.env.STAFF_PASSWORD)) {
        recordFailure(ip);
        console.warn(`⚠ Fehlgeschlagener Login-Versuch von ${ip}`);
        return res.status(401).json({ message: 'Passwort falsch' });
    }

    attempts.delete(ip);
    res.json(issueToken());
};

exports.requireAuth = (req, res, next) => {
    if (req.method === 'OPTIONS') return next();

    const apiKey = req.get('X-API-Key');
    if (apiKey && process.env.INTEGRATION_API_KEY && safeEqual(apiKey, process.env.INTEGRATION_API_KEY)) {
        return next();
    }

    if (!isConfigured()) {
        console.error('❌ Zugriff gesperrt: AUTH_SECRET (min. 32 Zeichen) oder STAFF_PASSWORD fehlt');
        return res.status(503).json({ message: 'Anmeldung ist nicht konfiguriert' });
    }

    const header = req.get('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token && verifyToken(token)) return next();

    return res.status(401).json({ message: 'Nicht angemeldet' });
};
