const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');

// Test Route
router.post('/test', (req, res) => {
    console.log("Test Route erreicht!");
    console.log("Body:", req.body);
    res.json({ message: "Test erfolgreich!" });
});

// Hauptrouten
router.get('/:taskId', formController.getFormByTaskId);
router.post('/', formController.createForm);
router.put('/:taskId', formController.updateForm);

module.exports = router;