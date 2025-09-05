const axios = require('axios');

async function resetQualifizierungViaAPI(taskId) {
    try {
        // Verwende die Produktions-URL direkt
        const baseUrl = 'https://formular-mitarbeiter.onrender.com/api/forms';
        
        console.log(`Resette Qualifizierungsstatus für TaskId: ${taskId}`);
        
        // Sende PUT request um nur den Qualifizierungsstatus zu ändern
        const response = await axios.put(`${baseUrl}/${taskId}`, {
            qualifiziert: false
        });
        
        if (response.status === 200) {
            console.log(`✅ Qualifizierungsstatus erfolgreich zurückgesetzt`);
            console.log(`Lead Name: ${response.data.leadName}`);
            console.log(`Qualifiziert: ${response.data.qualifiziert}`);
        }
        
    } catch (error) {
        if (error.response?.status === 404) {
            console.error(`❌ Formular mit TaskId ${taskId} nicht gefunden`);
        } else {
            console.error('❌ Fehler beim Zurücksetzen:', error.message);
            if (error.response?.data) {
                console.error('Details:', error.response.data);
            }
        }
    }
}

// TaskId aus dem Link
const taskId = '8699r1ckb';
resetQualifizierungViaAPI(taskId);