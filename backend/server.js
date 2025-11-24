const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import DB config
const connectDB = require('./config/db');

// Express app initialisieren
const app = express();

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
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to MongoDB
connectDB();

// Body Parser Middleware mit Error Handling
app.use(bodyParser.json({
    verify: (req, res, buf, encoding) => {
        // Speichere den rohen Body für Debugging bei Parsing-Fehlern
        req.rawBody = buf.toString(encoding || 'utf8');
    }
}));
app.use(bodyParser.urlencoded({ extended: true }));

// JSON Parsing Error Handler
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('❌ JSON Parsing Fehler:');
        console.error('Raw Body:', req.rawBody);
        console.error('Error:', err.message);
        return res.status(400).json({
            message: 'Ungültiges JSON Format',
            error: err.message,
            receivedData: req.rawBody
        });
    }
    next(err);
});

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Privatinsolvenz API läuft' });
});

// Routes
app.use('/api/forms', require('./routes/formRoutes'));

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