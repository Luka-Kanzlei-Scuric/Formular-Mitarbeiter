const Form = require('../models/Form');

// Get Form by TaskId
exports.getFormByTaskId = async (req, res) => {
    try {
        const form = await Form.findOne({ taskId: req.params.taskId });
        if (!form) {
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }
        res.json(form);
    } catch (error) {
        res.status(500).json({ message: error.message });
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
            console.log("Formular existiert bereits:", existingForm);
            return res.status(400).json({ message: "Formular existiert bereits" });
        }

        const form = new Form({
            taskId: req.body.taskId,
            leadName: req.body.leadName
        });

        const savedForm = await form.save();
        console.log("Formular erfolgreich erstellt:", savedForm);

        res.status(201).json(savedForm);
    } catch (error) {
        console.error("Fehler beim Erstellen des Formulars:", error);
        res.status(400).json({ message: error.message });
    }
};

// Update Form
exports.updateForm = async (req, res) => {
    try {
        const updatedForm = await Form.findOneAndUpdate(
            { taskId: req.params.taskId },
            req.body,
            { new: true }
        );
        if (!updatedForm) {
            return res.status(404).json({ message: 'Formular nicht gefunden' });
        }
        res.json(updatedForm);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};