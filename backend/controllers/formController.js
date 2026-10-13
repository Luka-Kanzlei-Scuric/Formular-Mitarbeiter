const Form = require('../models/Form');
const { validationResult } = require('express-validator');
const { calculatePricing } = require('../lib/pricing');
const { buildUpdatePayload } = require('../services/makePayload');
const { deliver } = require('../services/make');
const IMMUTABLE = new Set(['_id', '__v', 'taskId', 'createdAt', 'updatedAt', 'preisKalkulation', 'makeDelivery']);
const editable = new Set(Object.keys(Form.schema.paths).filter(key => !IMMUTABLE.has(key) && !key.includes('.')));
const formUrl = (req, taskId) => `${req.app.locals.config.frontendUrl}/form/${encodeURIComponent(taskId)}`;
function fail(res, error) {
    if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: 'Ungültige Formulardaten' });
    if (error.code === 11000 || error.name === 'VersionError') return res.status(409).json({ message: 'Das Formular wurde bereits geändert. Bitte neu laden.' });
    console.error(JSON.stringify({ event: 'form_request_failed' }));
    return res.status(500).json({ message: 'Interner Serverfehler' });
}
exports.getFormByTaskId = async (req, res) => {
    try {
        const form = await Form.findOne({ taskId: req.params.taskId });
        if (!form) return res.status(404).json({ message: 'Formular nicht gefunden' });
        // A GET must never write prices, timestamps or migration data.
        res.json(form);
    } catch (error) { fail(res, error); }
};
exports.createForm = async (req, res) => {
    if (!validationResult(req).isEmpty()) return res.status(400).json({ message: 'taskId, leadName oder Telefonnummer ungültig' });
    try {
        if (await Form.exists({ taskId: req.body.taskId })) return res.status(409).json({ message: 'Formular existiert bereits', formURL: formUrl(req, req.body.taskId) });
        await Form.create({ taskId: req.body.taskId, leadName: req.body.leadName, phoneNumber: req.body.phoneNumber });
        res.status(201).json({ message: 'Formular erstellt!', formURL: formUrl(req, req.body.taskId) });
    } catch (error) { fail(res, error); }
};
exports.searchFormsByName = async (req, res) => {
    const name = req.query.name;
    if (typeof name !== 'string' || !name.trim() || name.length > 100) return res.status(400).json({ message: 'Suchname muss 1 bis 100 Zeichen enthalten' });
    try {
        const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const forms = await Form.find({ leadName: { $regex: escaped, $options: 'i' } })
            .select('taskId leadName vorname nachname createdAt').sort({ createdAt: -1 }).limit(100).lean();
        res.json(forms.map(form => ({ taskId: form.taskId, leadName: form.leadName,
            vorname: form.vorname || '', nachname: form.nachname || '', erstelltAm: form.createdAt, formURL: formUrl(req, form.taskId) })));
    } catch (error) { fail(res, error); }
};
exports.updateForm = async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ message: 'Ungültige Formulardaten' });
    const keys = Object.keys(req.body);
    if (keys.some(key => key.startsWith('$') || key.includes('.') || ['__proto__', 'constructor', 'prototype'].includes(key))) return res.status(400).json({ message: 'Ungültige Formulardaten' });
    try {
        const form = await Form.findOne({ taskId: req.params.taskId });
        if (!form) return res.status(404).json({ message: 'Formular nicht gefunden' });
        if (req.body.__v !== undefined && req.body.__v !== form.__v) return res.status(409).json({ message: 'Das Formular wurde bereits geändert. Bitte neu laden.' });
        for (const key of keys) if (editable.has(key)) form.set(key, req.body[key]);
        form.preisKalkulation = calculatePricing(form);
        form.makeDelivery = { status: 'pending', attemptedAt: new Date() };
        await form.save();
        const integration = await deliver(req.app.locals.config, 'update', buildUpdatePayload(form));
        // Store delivery state separately without overwriting later employee edits.
        await Form.updateOne({ _id: form._id, __v: form.__v }, { $set: { makeDelivery: { status: integration.status, attemptedAt: new Date() } } }, { timestamps: false });
        const data = form.toObject();
        data.makeDelivery = { status: integration.status, attemptedAt: new Date() };
        res.json({ ...data, _integration: integration });
    } catch (error) { fail(res, error); }
};
exports.sendPKontoEmail = async (req, res) => {
    const data = req.body || {};
    const fields = ['taskId', 'name', 'adresse', 'geburtsdatum', 'hausbank', 'bemerkungen', 'leadName'];
    if (fields.some(key => data[key] !== undefined && (typeof data[key] !== 'string' || data[key].length > 4000)) || !data.taskId || !data.name) return res.status(400).json({ message: 'Ungültige P-Konto-Daten' });
    try {
        if (!await Form.exists({ taskId: data.taskId })) return res.status(404).json({ message: 'Formular nicht gefunden' });
        const payload = Object.fromEntries(fields.map(key => [key, data[key] || '']));
        payload.type = 'pkonto_bescheinigung';
        payload.timestamp = new Date().toISOString();
        payload.subject = `P-Konto-Bescheinigung Antrag - ${data.name} (${data.taskId})`;
        payload.message = `P-Konto-Bescheinigung Antrag\n\nMandantendaten:\n- Name: ${payload.name}\n- Adresse: ${payload.adresse}\n- Geburtsdatum: ${payload.geburtsdatum}\n- Hausbank: ${payload.hausbank}\n- Lead Name: ${payload.leadName}\n- Task ID: ${payload.taskId}\n${payload.bemerkungen ? '\nZusätzliche Bemerkungen:\n' + payload.bemerkungen : ''}\n\nBitte erstellen Sie eine P-Konto-Bescheinigung für den o.g. Mandanten.\n\nMit freundlichen Grüßen\nAutomatisches System`;
        const integration = await deliver(req.app.locals.config, 'pkonto', payload);
        if (integration.status === 'disabled') return res.status(503).json({ success: false, message: 'P-Konto-Versand ist deaktiviert' });
        if (integration.status === 'failed') return res.status(502).json({ success: false, message: 'Die Übergabe an Make.com ist fehlgeschlagen' });
        res.json({ success: true, message: 'Anfrage an Make.com übergeben', taskId: data.taskId });
    } catch (error) { fail(res, error); }
};
