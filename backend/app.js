const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { createAuth } = require('./middleware/auth');
function createApp(config) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', config.trustProxy);
    app.locals.config = config;
    app.use((req, res, next) => {
        res.set('Cache-Control', 'no-store');
        res.set('X-InsoCore-Env', config.environment);
        res.set('X-Content-Type-Options', 'nosniff');
        next();
    });
    app.use(cors({
        origin(origin, callback) { callback(null, !origin || origin === config.frontendUrl || config.corsOrigins.includes(origin)); },
        methods: ['GET', 'POST', 'PUT', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    }));
    app.get('/api/health/live', (req, res) => res.json({ status: 'ok', release: config.release, environment: config.environment }));
    app.get('/api/health/ready', async (req, res) => {
        try {
            if (mongoose.connection.readyState !== 1) throw new Error('not connected');
            await mongoose.connection.db.admin().command({ ping: 1 });
            res.json({ status: 'ready', release: config.release, environment: config.environment });
        } catch { res.status(503).json({ status: 'not-ready' }); }
    });
    app.use('/api/forms', (req, res, next) => config.maintenance
        ? res.status(503).set('Retry-After', '300').json({ message: 'Wartung. Bitte später erneut versuchen.' }) : next());
    app.use(express.json({ limit: '256kb' }));
    app.use(express.urlencoded({ extended: false, limit: '256kb' }));
    const auth = createAuth(config);
    app.post('/api/auth/login', auth.loginLimit, auth.login);
    app.use('/api/forms', auth.requireAuth, require('./routes/formRoutes'));
    app.use((req, res) => res.status(404).json({ message: 'Nicht gefunden' }));
    app.use((err, req, res, next) => {
        const status = err.type === 'entity.parse.failed' ? 400 : err.status === 413 ? 413 : 500;
        console.error(JSON.stringify({ event: 'request_failed', status }));
        res.status(status).json({ message: status === 400 ? 'Ungültiges JSON Format' : status === 413 ? 'Anfrage zu groß' : 'Interner Serverfehler' });
    });
    return app;
}
module.exports = { createApp };
