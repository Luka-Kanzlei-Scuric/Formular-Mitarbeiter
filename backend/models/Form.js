const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
    taskId: {
        type: String,
        required: true,
        unique: true,
        index: true // Verbessert die Suchperformance
    },
    leadName: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Form', formSchema);