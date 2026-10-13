const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/formController');
router.get('/search', controller.searchFormsByName);
router.post('/send-pkonto-email', controller.sendPKontoEmail);
router.get('/:taskId', controller.getFormByTaskId);
router.post('/', [
    body('taskId').isString().isLength({ min: 1, max: 128 }).matches(/^[a-zA-Z0-9_-]+$/),
    body('leadName').isString().trim().isLength({ min: 1, max: 200 }),
    body('phoneNumber').optional().isString().isLength({ max: 100 }),
], controller.createForm);
router.put('/:taskId', controller.updateForm);
module.exports = router;
