const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const formController = require('../controllers/formController');

// Middleware für Logging
const requestLogger = (req, res, next) => {
    console.log(`📩 [${req.method}] Anfrage an ${req.originalUrl}`);
    console.log("📦 Body:", req.body);
    next();
};

router.use(requestLogger);

// Test Route
router.post('/test', (req, res) => {
    console.log("✅ Test Route erreicht!");
    console.log("📦 Body:", req.body);
    res.json({ message: "Test erfolgreich!" });
});

// Hauptrouten
router.get('/:taskId', async (req, res) => {
    try {
        await formController.getFormByTaskId(req, res);
    } catch (error) {
        console.error("❌ Fehler bei GET /:taskId:", error.message);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

router.post(
    '/',
    [
        body('taskId').notEmpty().withMessage('taskId ist erforderlich'),
        body('leadName').optional().isString().withMessage('leadName muss ein String sein')
    ],
    async (req, res) => {
        try {
            await formController.createForm(req, res);
        } catch (error) {
            console.error("❌ Fehler bei POST /:", error.message);
            res.status(500).json({ error: "Interner Serverfehler" });
        }
    }
);

router.put('/:taskId', async (req, res) => {
    try {
        await formController.updateForm(req, res);
    } catch (error) {
        console.error("❌ Fehler bei PUT /:taskId:", error);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

module.exports = router;