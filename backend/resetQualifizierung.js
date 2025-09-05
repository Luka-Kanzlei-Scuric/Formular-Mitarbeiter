const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB-Verbindung
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB verbunden');
    } catch (error) {
        console.error('MongoDB Verbindungsfehler:', error);
        process.exit(1);
    }
};

// Form Model importieren
const Form = require('./models/Form');

async function resetQualifizierung(taskId) {
    try {
        await connectDB();
        
        console.log(`Resette Qualifizierungsstatus für TaskId: ${taskId}`);
        
        const updatedForm = await Form.findOneAndUpdate(
            { taskId: taskId },
            { qualifiziert: false },
            { new: true }
        );
        
        if (!updatedForm) {
            console.error(`Formular mit TaskId ${taskId} nicht gefunden`);
            return;
        }
        
        console.log(`✅ Qualifizierungsstatus erfolgreich zurückgesetzt für ${updatedForm.leadName}`);
        console.log(`Qualifiziert: ${updatedForm.qualifiziert}`);
        
    } catch (error) {
        console.error('Fehler beim Zurücksetzen:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB Verbindung geschlossen');
    }
}

// TaskId aus dem Link
const taskId = '8699r1ckb';
resetQualifizierung(taskId);