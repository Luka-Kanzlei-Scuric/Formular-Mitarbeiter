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
        console.log("📝 CreateForm aufgerufen mit:", req.body);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { taskId, leadName } = req.body;

        if (!taskId) {
            console.warn("⚠ `taskId` ist erforderlich!");
            return res.status(400).json({ message: "taskId ist erforderlich!" });
        }

        const existingForm = await Form.findOne({ taskId });
        if (existingForm) {
            console.warn("⚠ Formular existiert bereits:", existingForm);
            return res.status(400).json({ message: "Formular existiert bereits" });
        }

        // Formular erstellen
        const form = new Form({ taskId, leadName });
        const savedForm = await form.save();

        // URL für das Formular generieren
        const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
        const formURL = `${frontendURL}/form/${taskId}`;
        console.log(`🔗 Formular-Link generiert: ${formURL}`);

        // Link zurück an ClickUp senden
        const clickUpAPIKey = process.env.CLICKUP_API_KEY;
        const clickUpFieldId = process.env.CLICKUP_FORM_LINK_FIELD_ID;

        const clickUpResponse = await axios.post(
            `https://api.clickup.com/api/v2/task/${taskId}/field/${clickUpFieldId}`,
            { value: formURL },
            { headers: { Authorization: clickUpAPIKey } }
        );

        console.log("✅ Link erfolgreich an ClickUp gesendet!", clickUpResponse.data);

        res.status(201).json({ message: "Formular erstellt!", formURL });
    } catch (error) {
        console.error("❌ Fehler beim Erstellen des Formulars:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};

// Update Form
exports.updateForm = async (req, res) => {
    try {
        console.log(`🔄 Update-Request für TaskId ${req.params.taskId}`);

        const allowedUpdates = ['leadName', 'email', 'telefonnummer']; // Erlaubte Felder
        const updateData = {};

        for (let key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                updateData[key] = req.body[key];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'Keine gültigen Felder zum Aktualisieren angegeben' });
        }

        const updatedForm = await Form.findOneAndUpdate(
            { taskId: req.params.taskId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedForm) {
            console.warn(`⚠ Formular mit TaskId ${req.params.taskId} nicht gefunden`);
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }

        console.log("✅ Formular erfolgreich aktualisiert:", updatedForm);

        // Bestätigung in ClickUp setzen
        const clickUpTaskId = req.params.taskId;
        const clickUpAPIKey = process.env.CLICKUP_API_KEY;
        const clickUpFieldId = "status_field_id"; // ID des Status-Feldes in ClickUp

        await axios.put(
            `https://api.clickup.com/api/v2/task/${clickUpTaskId}/field/${clickUpFieldId}`,
            { value: "Formular ausgefüllt" },
            { headers: { Authorization: clickUpAPIKey } }
        );

        console.log("✅ Status erfolgreich in ClickUp aktualisiert!");

        res.json(updatedForm);
    } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Formulars:", error);
        res.status(500).json({ message: "Interner Serverfehler" });
    }
};