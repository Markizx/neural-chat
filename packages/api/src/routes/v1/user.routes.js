const router = require('express').Router();
const { body } = require('express-validator');
const userController = require('../../controllers/user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');

// Validation rules
const updateProfileValidation = [
  body('name').optional().trim().notEmpty(),
  body('settings.theme').optional().isIn(['light', 'dark', 'system']),
  body('settings.language').optional().isIn(['en', 'ru', 'es', 'fr', 'de', 'zh', 'ja']),
  body('settings.fontSize').optional().isInt({ min: 12, max: 20 }),
  body('settings.notifications').optional().isObject()
];

// Routes
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', updateProfileValidation, userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.put('/avatar', uploadMiddleware.single('avatar'), userController.updateAvatar);
router.put('/settings', userController.updateSettings);
router.get('/usage', userController.getUsage);
router.get('/subscription', userController.getSubscription);
router.get('/invoices', userController.getInvoices);
router.post('/export-data', userController.exportData);

module.exports = router;