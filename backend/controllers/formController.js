const axios = require('axios'); // Für HTTP-Anfragen an ClickUp
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

        // ClickUp-API aufrufen
        const CLICKUP_API_KEY = process.env.CLICKUP_API_KEY;
        if (!CLICKUP_API_KEY) {
            throw new Error("❌ ClickUp API Key fehlt! Setze ihn in der .env Datei oder in Render.");
        }

        const clickupTaskId = req.body.taskId; // Task-ID von ClickUp
        const updateURL = `https://api.clickup.com/api/v2/task/${clickupTaskId}`;

        const response = await axios.put(updateURL, {
            custom_fields: [{
                id: "699bcb25-bbe2-454b-a6cd-f255681e7940", // Die Field ID von ClickUp
                value: `https://deinfrontend.com/form/${req.body.taskId}`
            }]
        }, {
            headers: {
                "Authorization": CLICKUP_API_KEY,
                "Content-Type": "application/json"
            }
        });

        console.log("✅ ClickUp Update erfolgreich:", response.data);

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

        // Berechne Preise für make.com
        const startgebuehr = 799;
        const preisProGlaeubiger = 39;
        const anzahlGlaeubiger = parseInt(updatedForm.glaeubiger) || 0;
        const gesamtPreis = startgebuehr + (anzahlGlaeubiger * preisProGlaeubiger);

        // Berechne Raten
        let monate = updatedForm.ratenzahlungMonate === 'custom'
            ? Math.min(Math.max(parseInt(updatedForm.benutzerdefinierteMonate) || 1, 1), 12)
            : parseInt(updatedForm.ratenzahlungMonate) || 2;
        const monatsRate = gesamtPreis / monate;

        // Sende Daten an make.com
        try {
            const makeWebhookUrl = 'https://hook.eu2.make.com/wm49imwg7p08738f392n8pu2hgwwzpac';
            await axios.post(makeWebhookUrl, {
                ...updatedForm.toObject(),
                preisKalkulation: {
                    startgebuehr,
                    preisProGlaeubiger,
                    anzahlGlaeubiger,
                    gesamtPreis,
                    ratenzahlung: {
                        monate,
                        monatsRate
                    }
                }
            });
            console.log("✅ Daten an make.com gesendet");
        } catch (makeError) {
            console.error("⚠️ Make.com Update fehlgeschlagen:", makeError.message);
        }

        // Optional: ClickUp Update, wenn benötigt
        try {
            const clickUpTaskId = req.params.taskId;
            const clickUpAPIKey = process.env.CLICKUP_API_KEY;

            if (clickUpAPIKey) {
                await axios.put(
                    `https://api.clickup.com/api/v2/task/${clickUpTaskId}/custom_field/${process.env.CLICKUP_FORM_LINK_FIELD_ID}`,
                    {
                        value: "Formular ausgefüllt"
                    },
                    {
                        headers: {
                            'Authorization': clickUpAPIKey,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                console.log("✅ ClickUp Status aktualisiert");
            }
        } catch (clickUpError) {
            console.error("⚠️ ClickUp Update fehlgeschlagen:", clickUpError.message);
        }

        console.log("✅ Formular erfolgreich aktualisiert:", updatedForm);
        res.json(updatedForm);

    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Formulars:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};