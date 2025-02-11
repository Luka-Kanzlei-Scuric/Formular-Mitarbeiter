const express = require('express');
const router = express.Router();
const Form = require('../models/Form');

router.post('/webhook', async (req, res) => {
    try {
        console.log("Webhook Daten empfangen:", JSON.stringify(req.body, null, 2));

        // Prüfen ob es ein Task-Create Event ist
        const eventType = req.body.event;

        if (!req.body.task_id || !req.body.task_name) {
            console.log("Kein Task-Event, wird ignoriert");
            return res.status(200).json({ message: "Kein Task-Event" });
        }

        // Prüfen ob bereits ein Formular existiert
        const existingForm = await Form.findOne({ taskId: req.body.task_id });
        if (existingForm) {
            console.log("Formular existiert bereits");
            return res.status(200).json({ message: "Formular existiert bereits" });
        }

        // Neues Formular erstellen
        const newForm = await Form.create({
            taskId: req.body.task_id,
            leadName: req.body.task_name
        });

        console.log("Neues Formular erstellt:", newForm);
        res.status(201).json({ message: "Formular erstellt", form: newForm });

    } catch (error) {
        console.error("Webhook Fehler:", error);
        res.status(500).json({ message: "Interner Server-Fehler" });
    }
});

module.exports = router;