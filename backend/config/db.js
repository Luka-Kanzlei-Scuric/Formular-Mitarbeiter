const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Fügen Sie diese Zeile hinzu, um die Deprecation Warning zu beheben
        mongoose.set('strictQuery', false);

        // Ändern Sie MONGO_URI zu MONGODB_URI
        const MONGODB_URI = process.env.MONGODB_URI;

        if (!MONGODB_URI) {
            throw new Error('MongoDB URI ist nicht in den Umgebungsvariablen definiert');
        }

        const conn = await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`✅ MongoDB verbunden: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Verbindungsfehler: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;