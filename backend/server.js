require('dotenv').config();
const mongoose = require('mongoose');
const { loadConfig } = require('./config/runtime');
const connectDB = require('./config/db');
const { createApp } = require('./app');
async function start() {
    const config = loadConfig();
    await connectDB(config);
    const server = createApp(config).listen(config.port, '0.0.0.0', () => {
        console.log(JSON.stringify({ event: 'started', environment: config.environment, release: config.release }));
    });
    server.on('error', () => { console.error('Listener failed'); process.exit(1); });
    let stopping = false;
    const shutdown = () => {
        if (stopping) return;
        stopping = true;
        const deadline = setTimeout(() => process.exit(1), 25000);
        deadline.unref();
        server.close(async () => { await mongoose.disconnect(); clearTimeout(deadline); process.exit(0); });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
start().catch(() => { console.error('Startup failed: check runtime configuration and MongoDB connectivity'); process.exit(1); });
