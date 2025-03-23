// Script zum Aktualisieren vorhandener Formulare mit preisKalkulation

require('dotenv').config();
const mongoose = require('mongoose');
const Form = require('./models/Form');

// Verbinde mit der Datenbank
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB verbunden...'))
  .catch(err => {
    console.error('Verbindungsfehler zu MongoDB:', err);
    process.exit(1);
  });

async function updateExistingForms() {
  try {
    console.log('Starte Update der bestehenden Formulare...');
    
    // Hole alle Formulare ohne preisKalkulation
    const forms = await Form.find({});
    console.log(`${forms.length} Formulare gefunden.`);
    
    let updatedCount = 0;
    
    for (const form of forms) {
      // Berechne Preise
      const startgebuehr = 799;
      const preisProGlaeubiger = 39;
      const anzahlGlaeubiger = parseInt(form.glaeubiger) || 0;
      const standardPrice = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

      // Berechnung des Pfändungspreises
      const nettoEinkommen = parseFloat(form.nettoEinkommen) || 0;
      const kinderAnzahl = parseInt(form.kinderAnzahl) || 0;
      let pfandungsPrice = 0;

      if (nettoEinkommen > 1500) {
        pfandungsPrice = (nettoEinkommen - 1500) * 0.2;
        pfandungsPrice = pfandungsPrice * (1 - (kinderAnzahl * 0.05));
        pfandungsPrice = pfandungsPrice * 3;
      }

      // Verwende den höheren Preis
      const gesamtPreis = form.manuellerPreis ?
        parseFloat(form.manuellerPreisBetrag) || standardPrice :
        Math.max(standardPrice, pfandungsPrice);

      // Berechne Raten
      let monate = form.ratenzahlungMonate === 'custom'
        ? Math.min(Math.max(parseInt(form.benutzerdefinierteMonate) || 1, 1), 12)
        : parseInt(form.ratenzahlungMonate) || 2;
      const monatsRate = gesamtPreis / monate;

      // Bestimme Berechnungsart
      const berechnungsart = form.manuellerPreis ? 'manuell' :
        (pfandungsPrice > standardPrice ? 'nach Pfändung' : 'nach Gläubiger');

      // Setze preisKalkulation
      form.preisKalkulation = {
        berechnungsart,
        startgebuehr,
        preisProGlaeubiger,
        anzahlGlaeubiger,
        standardPrice,
        pfandungsPrice,
        gesamtPreis,
        ratenzahlung: {
          monate,
          monatsRate
        }
      };

      await form.save();
      updatedCount++;
      console.log(`Formular mit TaskId ${form.taskId} aktualisiert.`);
    }
    
    console.log(`${updatedCount} Formulare erfolgreich aktualisiert.`);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Formulare:', error);
  } finally {
    mongoose.disconnect();
    console.log('MongoDB-Verbindung getrennt.');
  }
}

updateExistingForms();