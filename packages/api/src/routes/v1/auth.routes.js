const router = require('express').Router();
const { body } = require('express-validator');
const authController = require('../../controllers/auth.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { handleValidationErrors } = require('../../middleware/validation.middleware');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, handleValidationErrors, authController.register);
router.post('/login', loginValidation, handleValidationErrors, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authenticate, authController.resendVerification);
router.post('/forgot-password', body('email').isEmail(), handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], handleValidationErrors, authController.resetPassword);
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], handleValidationErrors, authController.changePassword);

// OAuth routes
router.post('/google', body('idToken').notEmpty(), handleValidationErrors, authController.googleAuth);
router.post('/apple', body('identityToken').notEmpty(), handleValidationErrors, authController.appleAuth);

// 2FA routes
router.post('/2fa/enable', authenticate, authController.enable2FA);
router.post('/2fa/verify', authenticate, body('token').notEmpty(), handleValidationErrors, authController.verify2FA);
router.post('/2fa/disable', authenticate, body('password').notEmpty(), handleValidationErrors, authController.disable2FA);

// Device management
router.post('/device/register', authenticate, [
  body('deviceId').notEmpty(),
  body('platform').notEmpty(),
  body('model').notEmpty(),
  body('osVersion').notEmpty(),
  body('appVersion').notEmpty()
], handleValidationErrors, authController.registerDevice);
router.delete('/device/:deviceId', authenticate, authController.removeDevice);
router.get('/devices', authenticate, authController.getDevices);
router.post('/logout-all-devices', authenticate, authController.logoutAllDevices);

module.exports = router;