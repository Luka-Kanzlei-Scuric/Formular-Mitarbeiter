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
        'https://formular-mitarbeiter.vercel.app',  // Deine neue Vercel URL
        'http://localhost:3000'  // Für lokale Entwicklung
    ],
    credentials: true
}));

// Connect to MongoDB
connectDB();



// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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