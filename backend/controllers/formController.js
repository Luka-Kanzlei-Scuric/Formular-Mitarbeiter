const axios = require('axios');
const Form = require('../models/Form');
const { validationResult } = require('express-validator');

// Get Form by TaskId
exports.getFormByTaskId = async (req, res) => {
    try {
        console.log(`🔎 Suche nach Formular mit TaskId: ${req.params.taskId}`);
        const form = await Form.findOne({ taskId: req.params.taskId });

        if (!form) {
            console.warn(`⚠ Formular mit TaskId ${req.params.taskId} nicht gefunden`);
            return res.status(404).json({ message: 'Formular nicht gefunden' });
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
exports.updateForm = async (req, res) => {
    try {
        console.log(`🔄 Update-Request für TaskId ${req.params.taskId}`);

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
                    gesamtPreis,
                    ratenzahlung: {
                        monate,
                        monatsRate
                    }
                },
                unterhalt: {
                    unterhaltspflicht: updatedForm.unterhaltspflicht || false,
                    unterhaltArt: updatedForm.unterhaltArt || '',
                    kinderAnzahl: updatedForm.kinderAnzahl || ''
                },
                persoenlicheDaten: {
                    geburtsdatum: updatedForm.geburtsdatum || '',
                    erlernterBeruf: updatedForm.erlernterBeruf || '',
                    derzeitigeTaetigkeit: updatedForm.derzeitigeTaetigkeit || ''
                },
                beruflicheSituation: {
                    warSelbststaendig: updatedForm.warSelbststaendig || false,
                    selbststaendig: updatedForm.selbststaendig || false
                },
                immobilien: {
                    vorhanden: updatedForm.immobilien || false,
                    details: updatedForm.immobilienDetails || '',
                    ausland: updatedForm.immobilieAusland || false
                },
                fahrzeug: {
                    vorhanden: updatedForm.fahrzeuge || false,
                    wert: updatedForm.fahrzeugWert || '',
                    finanziert: updatedForm.fahrzeugFinanziert || false,
                    kreditsumme: updatedForm.fahrzeugKreditsumme || '',
                    briefBeiBank: updatedForm.fahrzeugbriefBank || false,
                    notwendig: updatedForm.fahrzeugNotwendig || false
                },
                vermoegen: {
                    sparbuch: {
                        vorhanden: updatedForm.sparbuch || false,
                        wert: updatedForm.sparbuchWert || ''
                    },
                    lebensversicherung: {
                        vorhanden: updatedForm.lebensversicherung || false,
                        wert: updatedForm.lebensversicherungWert || ''
                    },
                    bausparvertrag: {
                        vorhanden: updatedForm.bausparvertrag || false,
                        wert: updatedForm.bausparvertragWert || ''
                    },
                    rentenversicherung: {
                        vorhanden: updatedForm.rentenversicherung || false,
                        wert: updatedForm.rentenversicherungWert || ''
                    },
                    weitere: {
                        vorhanden: updatedForm.weitereVermoegen || false,
                        details: updatedForm.weitereVermoegenDetails || ''
                    }
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
                qualifizierungsStatus: updatedForm.qualifiziert || false
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