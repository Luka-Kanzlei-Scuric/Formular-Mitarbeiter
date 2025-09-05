const axios = require('axios');

async function resetQualifizierungVercel(taskId) {
    try {
        // Versuche verschiedene mögliche API URLs
        const urls = [
            'https://formular-mitarbeiter.vercel.app/api/forms',
            'https://formular-mitarbeiter-backend.onrender.com/api/forms',
            'https://formular-mitarbeiter.onrender.com/api/forms'
        ];
        
        console.log(`Suche Formular mit TaskId: ${taskId}`);
        
        for (const baseUrl of urls) {
            try {
                console.log(`\nVersuche ${baseUrl}...`);
                
                // Erst versuchen, das Formular zu finden
                const getResponse = await axios.get(`${baseUrl}/${taskId}`);
                
                if (getResponse.status === 200) {
                    console.log(`✅ Formular gefunden bei ${baseUrl}`);
                    console.log(`Lead Name: ${getResponse.data.leadName}`);
                    console.log(`Aktueller Qualifizierungsstatus: ${getResponse.data.qualifiziert}`);
                    
                    // Jetzt zurücksetzen
                    const putResponse = await axios.put(`${baseUrl}/${taskId}`, {
                        qualifiziert: false
                    });
                    
                    if (putResponse.status === 200) {
                        console.log(`✅ Qualifizierungsstatus erfolgreich zurückgesetzt`);
                        console.log(`Neuer Qualifizierungsstatus: ${putResponse.data.qualifiziert}`);
                        return;
                    }
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`❌ Nicht gefunden bei ${baseUrl}`);
                } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    console.log(`❌ Server nicht erreichbar: ${baseUrl}`);
                } else {
                    console.log(`❌ Fehler bei ${baseUrl}: ${error.message}`);
                }
            }
        }
        
        console.log('\n❌ Formular konnte auf keinem Server gefunden werden.');
        
    } catch (error) {
        console.error('❌ Unerwarteter Fehler:', error.message);
    }
}

// TaskId aus dem Link
const taskId = '8699r1ckb';
resetQualifizierungVercel(taskId);