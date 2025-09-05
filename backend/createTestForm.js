const axios = require('axios');

// Test-Formular Daten
const testForm = {
  taskId: 'test123',
  leadName: 'Test Person',
  familienstand: 'ledig',
  kinderAnzahl: '1',
  kinderAlter: '5',
  strasse: 'Teststraße',
  hausnummer: '123',
  wohnort: 'Berlin',
  plz: '10115',
  beschaeftigungsArt: 'angestellt',
  nettoEinkommen: '2500',
  gesamtSchulden: '25000',
  glaeubiger: '5'
};

async function createTestForm() {
  try {
    console.log('Erstelle Test-Formular...');
    const response = await axios.post('http://localhost:5001/api/forms', testForm);
    console.log('Erfolg:', response.data);
    console.log(`Formular-URL: ${response.data.formURL}`);
  } catch (error) {
    console.error('Fehler beim Erstellen des Formulars:', error.response?.data || error.message);
  }
}

createTestForm();