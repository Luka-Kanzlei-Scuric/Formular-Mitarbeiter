// Legacy fee estimate, not a statutory garnishment calculation.
// Retain existing saved/backend behavior until the business rule is confirmed.
function calculatePricing(form) {
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const anzahlGlaeubiger = parseInt(form.glaeubiger) || 0;
        const standardPrice = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

        // Berechnung des Pfändungspreises - einfache Schätzung
        const nettoEinkommen = parseFloat(form.nettoEinkommen) || 0;
        const kinderAnzahl = parseInt(form.kinderAnzahl) || 0;
        let pfandungsPrice = 0;

        // Einfache Berechnung: Wenn Einkommen über 1500€, 20% des Überschusses ist pfändbar
        if (nettoEinkommen > 1500) {
            pfandungsPrice = (nettoEinkommen - 1500) * 0.2;
            // Reduziere für jedes Kind um 5%
            pfandungsPrice = pfandungsPrice * (1 - (kinderAnzahl * 0.05));
            // Multipliziere mit 3 Monaten für den Gesamtbetrag
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

        // Speichere die Preiskalkulation im Dokument
        const berechnungsart = form.manuellerPreis ? 'manuell' :
            (pfandungsPrice > standardPrice ? 'nach Pfändung' : 'nach Gläubiger');

    return { berechnungsart, startgebuehr, preisProGlaeubiger, standardPrice,
        pfandungsPrice, gesamtPreis, ratenzahlung: { monate, monatsRate } };
}
module.exports = { calculatePricing };
