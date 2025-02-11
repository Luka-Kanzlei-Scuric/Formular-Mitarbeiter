const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);

        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            throw new Error('❌ MongoDB URI ist nicht in den Umgebungsvariablen definiert');
        }

        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Falls die Verbindung nicht klappt, nicht ewig warten
        });

        console.log(`✅ MongoDB verbunden: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Verbindungsfehler: ${error.message}`);

        if (process.env.NODE_ENV === 'development') {
            console.error(error);
        }

        // NICHT gleich den Prozess beenden - nur in Entwicklung nötig
        setTimeout(() => process.exit(1), 5000);
    }
};

module.exports = connectDB;