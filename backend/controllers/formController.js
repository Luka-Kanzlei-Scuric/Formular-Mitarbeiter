const axios = require('axios');
const Form = require('../models/Form');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get Form by TaskId
exports.getFormByTaskId = async (req, res) => {
    try {
        console.log(`🔎 Suche nach Formular mit TaskId: ${req.params.taskId}`);
        const form = await Form.findOne({ taskId: req.params.taskId });

        if (!form) {
            console.warn(`⚠ Formular mit TaskId ${req.params.taskId} nicht gefunden`);
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }

        // Sicherstellen, dass Preise korrekt berechnet sind, wenn sie fehlen oder 0 sind
        if (!form.preisKalkulation || form.preisKalkulation.gesamtPreis === 0) {
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

            // Aktualisiere preisKalkulation für die Antwort
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

            console.log("Preise neu berechnet für GET-Anfrage:", {
                standardPrice,
                pfandungsPrice,
                gesamtPreis,
                berechnungsart
            });

            // Optional: Speichern der aktualisierten Preisinfos in der Datenbank
            await form.save();
        }

        console.log("✅ Formular gefunden:", form);
        res.json(form);
    } catch (error) {
        console.error("❌ Fehler in getFormByTaskId:", error.stack);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};

// Create Form
exports.createForm = async (req, res) => {
    try {
        console.log("CreateForm aufgerufen mit:", req.body);

        if (!req.body.taskId) {
            return res.status(400).json({ message: "taskId ist erforderlich!" });
        }

        const existingForm = await Form.findOne({ taskId: req.body.taskId });
        if (existingForm) {
            return res.status(400).json({ message: "Formular existiert bereits" });
        }

        // Formular in MongoDB erstellen
        const form = new Form({
            taskId: req.body.taskId,
            leadName: req.body.leadName
        });

        const savedForm = await form.save();
        console.log("✅ Formular erfolgreich in MongoDB erstellt:", savedForm);

        res.status(201).json({
            message: "Formular erstellt!",
            formURL: `${process.env.FRONTEND_URL}/form/${req.body.taskId}`
        });

    } catch (error) {
        console.error("❌ Fehler beim Erstellen des Formulars:", error.response?.data || error.message);
        res.status(500).json({ message: "Interner Serverfehler", error: error.message });
    }
};

// Update Form
// Neue Funktion zum Suchen von Formularen nach Namen
exports.searchFormsByName = async (req, res) => {
    try {
        const searchName = req.query.name;
        
        if (!searchName) {
            return res.status(400).json({ message: 'Ein Suchname ist erforderlich' });
        }
        
        console.log(`🔎 Suche nach Formularen mit Namen, der "${searchName}" enthält`);
        
        // Suche nach Formularen, deren leadName den Suchbegriff enthält (case-insensitive)
        const forms = await Form.find({
            leadName: { $regex: searchName, $options: 'i' }
        }).select('taskId leadName vorname nachname createdAt').sort({ createdAt: -1 });
        
        if (forms.length === 0) {
            console.warn(`⚠ Keine Formulare gefunden, die "${searchName}" im Namen enthalten`);
            return res.status(404).json({ message: 'Keine passenden Formulare gefunden' });
        }
        
        // Formatlieren der Ergebnisse mit URL
        const formattedResults = forms.map(form => ({
            taskId: form.taskId,
            leadName: form.leadName,
            vorname: form.vorname || '',
            nachname: form.nachname || '',
            erstelltAm: form.createdAt,
            formURL: `${process.env.FRONTEND_URL}/form/${form.taskId}`
        }));
        
        console.log(`✅ ${forms.length} Formulare gefunden für "${searchName}"`);
        res.json(formattedResults);
    } catch (error) {
        console.error("❌ Fehler bei der Suche nach Formularen:", error.stack);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};

exports.updateForm = async (req, res) => {
    try {
        console.log(`🔄 Update-Request für TaskId ${req.params.taskId}`);

        console.log("Request body:", req.body);
        
        const updatedForm = await Form.findOneAndUpdate(
            { taskId: req.params.taskId },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedForm) {
            console.warn(`⚠ Formular mit TaskId ${req.params.taskId} nicht gefunden`);
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }

        // Berechne Preise für make.com und Datenbank
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const anzahlGlaeubiger = parseInt(updatedForm.glaeubiger) || 0;
        const standardPrice = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

        // Berechnung des Pfändungspreises - einfache Schätzung
        const nettoEinkommen = parseFloat(updatedForm.nettoEinkommen) || 0;
        const kinderAnzahl = parseInt(updatedForm.kinderAnzahl) || 0;
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
        const gesamtPreis = updatedForm.manuellerPreis ?
            parseFloat(updatedForm.manuellerPreisBetrag) || standardPrice :
            Math.max(standardPrice, pfandungsPrice);

        // Berechne Raten
        let monate = updatedForm.ratenzahlungMonate === 'custom'
            ? Math.min(Math.max(parseInt(updatedForm.benutzerdefinierteMonate) || 1, 1), 12)
            : parseInt(updatedForm.ratenzahlungMonate) || 2;
        const monatsRate = gesamtPreis / monate;

        // Speichere die Preiskalkulation im Dokument
        const berechnungsart = updatedForm.manuellerPreis ? 'manuell' :
            (pfandungsPrice > standardPrice ? 'nach Pfändung' : 'nach Gläubiger');

        updatedForm.preisKalkulation = {
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
        
        console.log("Berechnete Preise:", { 
            anzahlGlaeubiger, 
            standardPrice, 
            pfandungsPrice, 
            gesamtPreis, 
            berechnungsart 
        });
        
        // Speichere die Änderungen in der Datenbank
        await updatedForm.save();

        // Sende Daten an make.com
        try {
            const makeWebhookUrl = 'https://hook.eu2.make.com/wm49imwg7p08738f392n8pu2hgwwzpac';
            const response = await axios.post(makeWebhookUrl, {
                ...updatedForm.toObject(),
                preisKalkulation: {
                    berechnungsart,
                    manuell: updatedForm.manuellerPreis || false,
                    manuellerPreisBetrag: updatedForm.manuellerPreisBetrag || "",
                    manuellerPreisNotiz: updatedForm.manuellerPreisNotiz || "",
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
                },
                persoenlicheDaten: {
                    vorname: updatedForm.vorname || '',
                    nachname: updatedForm.nachname || '',
                    familienstand: updatedForm.familienstand || '',
                    geburtsdatum: updatedForm.geburtsdatum || '',
                    geburtsort: updatedForm.geburtsort || '',
                    strasse: updatedForm.strasse || '',
                    hausnummer: updatedForm.hausnummer || '',
                    wohnort: updatedForm.wohnort || '',
                    plz: updatedForm.plz || ''
                },
                unterhalt: {
                    unterhaltspflicht: updatedForm.unterhaltspflicht || false,
                    unterhaltArt: updatedForm.unterhaltArt || '',
                    kinderAnzahl: updatedForm.kinderAnzahl || ''
                },
                einkommensverhaeltnis: {
                    beschaeftigungsArt: updatedForm.beschaeftigungsArt || '',
                    nettoEinkommen: updatedForm.nettoEinkommen || '',
                    nebenbeschaeftigung: updatedForm.nebenbeschaeftigung || '',
                    nebenbeschaeftigungBemerkung: updatedForm.nebenbeschaeftigungBemerkung || '',
                    zusatzEinkommen: updatedForm.zusatzEinkommen || '',
                    zusatzEinkommenBemerkung: updatedForm.zusatzEinkommenBemerkung || ''
                },
                berufserfahrung: {
                    erlernterBeruf: updatedForm.erlernterBeruf || '',
                    derzeitigeTaetigkeit: updatedForm.derzeitigeTaetigkeit || ''
                },
                sonstigeAngaben: {
                    warSelbststaendig: updatedForm.warSelbststaendig || false,
                    warSelbststaendigBemerkung: updatedForm.warSelbststaendigBemerkung || '',
                    sbGemeldetAbgemeldet: updatedForm.sbGemeldetAbgemeldet || '',
                    sbGemeldetAbgemeldetBemerkung: updatedForm.sbGemeldetAbgemeldetBemerkung || '',
                    selbststaendig: updatedForm.selbststaendig || false
                },
                immobilien: {
                    vorhanden: updatedForm.immobilien || false,
                    details: updatedForm.immobilienDetails || '',
                    bemerkung: updatedForm.immobilienBemerkung || '',
                    ausland: updatedForm.immobilieAusland || false
                },
                fahrzeug: {
                    vorhanden: updatedForm.fahrzeuge || false,
                    wert: updatedForm.fahrzeugWert || '',
                    finanzierungArt: updatedForm.fahrzeugFinanzierungArt || '',
                    finanziert: updatedForm.fahrzeugFinanziert || false,
                    kreditsumme: updatedForm.fahrzeugKreditsumme || '',
                    briefBeiBank: updatedForm.fahrzeugbriefBank || false,
                    notwendig: updatedForm.fahrzeugNotwendig || false,
                    arbeitsweg: updatedForm.fahrzeugArbeitsweg || false,
                    arbeitswegKm: updatedForm.fahrzeugArbeitswegKm || ''
                },
                vermoegenAnAngehoerige: {
                    zweiJahre: updatedForm.vermoegenAngehoerige2Jahre || false,
                    zweiJahreBetrag: updatedForm.vermoegenAngehoerige2JahreBetrag || '',
                    vierJahre: updatedForm.vermoegenAngehoerige4Jahre || false,
                    vierJahreBetrag: updatedForm.vermoegenAngehoerige4JahreBetrag || ''
                },
                vermoegen: {
                    sparbuch: {
                        vorhanden: updatedForm.sparbuch || false,
                        wert: updatedForm.sparbuchWert || ''
                    },
                    investDepotGeldanlagen: {
                        vorhanden: updatedForm.investDepotGeldanlagen || false,
                        wert: updatedForm.investDepotGeldanlagenWert || ''
                    },
                    lebensversicherung: {
                        vorhanden: updatedForm.lebensversicherung || false,
                        wert: updatedForm.lebensversicherungWert || '',
                        rueckkaufwert: updatedForm.lebensversicherungRueckkaufwert || ''
                    },
                    bausparvertrag: {
                        vorhanden: updatedForm.bausparvertrag || false,
                        wert: updatedForm.bausparvertragWert || '',
                        rueckkaufwert: updatedForm.bausparvertragRueckkaufwert || ''
                    },
                    rentenversicherung: {
                        vorhanden: updatedForm.rentenversicherung || false,
                        wert: updatedForm.rentenversicherungWert || '',
                        rueckkaufwert: updatedForm.rentenversicherungRueckkaufwert || ''
                    },
                    weitere: {
                        vorhanden: updatedForm.weitereVermoegen || false,
                        details: updatedForm.weitereVermoegenDetails || '',
                        bemerkung: updatedForm.weitereVermoegenBemerkung || ''
                    }
                },
                schulden: {
                    gesamtSchulden: updatedForm.gesamtSchulden || '',
                    gesamtSchuldenBemerkung: updatedForm.gesamtSchuldenBemerkung || '',
                    hausbank: updatedForm.hausbank || '',
                    dispo: updatedForm.dispo || '',
                    dispoBemerkung: updatedForm.dispoBemerkung || '',
                    pKonto: updatedForm.pKonto || false,
                    pKontoBemerkung: updatedForm.pKontoBemerkung || '',
                    kontoWechselEmpfohlen: updatedForm.kontoWechselEmpfohlen || false,
                    kontoWechselEmpfohlenBemerkung: updatedForm.kontoWechselEmpfohlenBemerkung || '',
                    glaeubiger: updatedForm.glaeubiger || '',
                    forderungenOeffentlich: updatedForm.forderungenOeffentlich || '',
                    forderungenPrivat: updatedForm.forderungenPrivat || '',
                    schuldenartInfo: updatedForm.schuldenartInfo || '',
                    schuldenartInfoBemerkung: updatedForm.schuldenartInfoBemerkung || '',
                    vorherigeInsolvenz: updatedForm.vorherigeInsolvenz || false,
                    vorherigeInsolvenzBemerkung: updatedForm.vorherigeInsolvenzBemerkung || ''
                },
                mandatsInfo: {
                    entschuldungsart: updatedForm.entschuldungsart || '',
                    ratenzahlungMonate: updatedForm.ratenzahlungMonate || '2'
                },
                schenkungen: {
                    anAngehoerige: {
                        vorhanden: updatedForm.schenkungAngehoerige || false,
                        details: updatedForm.schenkungAngehoerigeDetails || ''
                    },
                    anAndere: {
                        vorhanden: updatedForm.schenkungAndere || false,
                        details: updatedForm.schenkungAndereDetails || ''
                    }
                },
                zustellung: {
                    perPost: updatedForm.zustellungPost || false,
                    perEmail: updatedForm.zustellungEmail || false
                },
                terminierung: {
                    bearbeitungStart: updatedForm.bearbeitungStart || '1',
                    bearbeitungMonat: updatedForm.bearbeitungMonat || '',
                    abrechnungStart: updatedForm.abrechnungStart || '1',
                    abrechnungMonat: updatedForm.abrechnungMonat || ''
                },
                qualifizierungsStatus: updatedForm.qualifiziert || false,
                notizen: updatedForm.notizen || ''
            });
            console.log("✅ Daten an make.com gesendet", response.status);
        } catch (makeError) {
            console.error("⚠️ Make.com Update fehlgeschlagen:", makeError.message);
            // Ausführlichere Fehlerinformationen bei vorhandener Response
            if (makeError.response) {
                console.error("Make.com Response:", makeError.response.data);
            }
        }

        console.log("✅ Formular erfolgreich aktualisiert:", updatedForm);
        res.json(updatedForm);
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Formulars:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};

// Send P-Konto-Bescheinigung Email
exports.sendPKontoEmail = async (req, res) => {
    try {
        const { taskId, name, adresse, geburtsdatum, hausbank, leadName } = req.body;
        
        console.log(`📧 P-Konto E-Mail wird gesendet für TaskId: ${taskId}`);
        
        // Make.com Webhook URL
        const makeWebhookUrl = 'https://hook.eu2.make.com/cnjcefb77q4e4bm432t9x9i162wp22h2';
        
        // Daten für Make.com vorbereiten
        const webhookData = {
            type: 'pkonto_bescheinigung',
            taskId: taskId,
            name: name,
            adresse: adresse,
            geburtsdatum: geburtsdatum,
            hausbank: hausbank,
            leadName: leadName,
            timestamp: new Date().toISOString(),
            subject: `P-Konto-Bescheinigung Antrag - ${name} (${taskId})`,
            message: `P-Konto-Bescheinigung Antrag

Mandantendaten:
- Name: ${name}
- Adresse: ${adresse}
- Geburtsdatum: ${geburtsdatum}
- Hausbank: ${hausbank}
- Lead Name: ${leadName}
- Task ID: ${taskId}

Bitte erstellen Sie eine P-Konto-Bescheinigung für den o.g. Mandanten.

Mit freundlichen Grüßen
Automatisches System`
        };

        // E-Mail über Make.com Webhook senden
        const response = await axios.post(makeWebhookUrl, webhookData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 Sekunden Timeout
        });

        console.log("✅ Make.com Webhook erfolgreich aufgerufen:", response.status);
        
        res.json({ 
            success: true, 
            message: "P-Konto E-Mail erfolgreich über Make.com versendet",
            taskId: taskId,
            webhookStatus: response.status
        });
        
    } catch (error) {
        console.error("❌ Fehler beim Senden der P-Konto E-Mail über Make.com:", error);
        
        // Detaillierte Fehlerbehandlung
        let errorMessage = "Fehler beim Senden der E-Mail";
        if (error.response) {
            errorMessage = `Make.com Webhook Fehler: ${error.response.status} - ${error.response.statusText}`;
        } else if (error.request) {
            errorMessage = "Keine Antwort von Make.com Webhook erhalten";
        } else {
            errorMessage = error.message;
        }
        
        res.status(500).json({ 
            success: false,
            message: errorMessage,
            taskId: req.body.taskId
        });
    }
};