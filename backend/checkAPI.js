const axios = require('axios');

async function checkAPIAndCreateForm() {
    const taskId = '8699r1ckb';
    const baseUrl = 'https://formular-mitarbeiter-backend.onrender.com/api/forms';
    
    try {
        console.log('1. Teste API Verbindung...');
        
        // Erstelle das Formular zuerst
        console.log('\n2. Erstelle Formular mit TaskId:', taskId);
        try {
            const createResponse = await axios.post(baseUrl, {
                taskId: taskId,
                leadName: 'Test Person für 8699r1ckb'
            });
            console.log('✅ Formular erfolgreich erstellt:', createResponse.data);
        } catch (error) {
            if (error.response?.data?.message === 'Formular existiert bereits') {
                console.log('ℹ️  Formular existiert bereits');
            } else {
                throw error;
            }
        }
        
        // Jetzt setze den Qualifizierungsstatus zurück
        console.log('\n3. Setze Qualifizierungsstatus zurück...');
        const updateResponse = await axios.put(`${baseUrl}/${taskId}`, {
            qualifiziert: false
        });
        
        console.log('✅ Qualifizierungsstatus erfolgreich zurückgesetzt');
        console.log('Lead Name:', updateResponse.data.leadName);
        console.log('Qualifiziert:', updateResponse.data.qualifiziert);
        console.log('\n📌 Formular URL: https://formular-mitarbeiter.vercel.app/form/' + taskId);
        
    } catch (error) {
        console.error('❌ Fehler:', error.response?.data || error.message);
    }
}

checkAPIAndCreateForm();