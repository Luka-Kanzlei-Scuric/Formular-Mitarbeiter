const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const formController = require('../controllers/formController');

// Middleware für Logging (ohne Body und ohne Query — dort stehen Mandantendaten)
const requestLogger = (req, res, next) => {
    console.log(`📩 [${req.method}] Anfrage an ${req.baseUrl}${req.path}`);
    next();
};

router.use(requestLogger);

// Hauptrouten
// Route für die Suche nach Namen
router.get('/search', async (req, res) => {
    try {
        await formController.searchFormsByName(req, res);
    } catch (error) {
        console.error("❌ Fehler bei GET /search:", error.message);
        res.status(500).json({ error: "Interner Serverfehler" });
    }
});

// Diese Route muss nach /search kommen, da sonst /search als taskId interpretiert wird
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
        body('leadName').optional().isString().withMessage('leadName muss ein String sein'),
        body('phoneNumber').optional().isString().withMessage('phoneNumber muss ein String sein')
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

// P-Konto-Bescheinigung E-Mail Route
router.post('/send-pkonto-email', async (req, res) => {
    try {
        await formController.sendPKontoEmail(req, res);
    } catch (error) {
        console.error("❌ Fehler bei POST /send-pkonto-email:", error);
        res.status(500).json({ error: "Interner Serverfehler beim Senden der P-Konto E-Mail" });
    }
});

module.exports = router;