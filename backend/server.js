const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import DB config
const connectDB = require('./config/db');
const { login, requireAuth } = require('./middleware/auth');

// Express app initialisieren
const app = express();

// Render sitzt hinter einem Proxy — nötig für die richtige Client-IP beim Login-Limit
app.set('trust proxy', 1);

//Middleware
app.use(cors({
    origin: [
        'https://formular-mitarbeiter.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://*.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Connect to MongoDB
connectDB();

// Body Parser Middleware mit Error Handling
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JSON Parsing Error Handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ JSON Parsing Fehler:', err.message);
        return res.status(400).json({
            message: 'Ungültiges JSON Format',
            error: err.message
        });
    }
    next(err);
});

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Privatinsolvenz API läuft' });
});

// Routes
app.post('/api/auth/login', login);
app.use('/api/forms', requireAuth, require('./routes/formRoutes'));

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Interner Server-Fehler',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server starten
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});