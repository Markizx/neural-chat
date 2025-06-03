const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authenticate } = require('../../middleware/auth.middleware');
const userController = require('../../controllers/user.controller');

// Get current user profile
router.get('/profile', authenticate, userController.getProfile);

// Update current user profile
router.put('/profile', 
  authenticate,
  [
    body('name').optional().isString().trim(),
    body('language').optional().isIn(['en', 'ru', 'es', 'fr', 'de', 'zh', 'ja'])
  ],
  userController.updateProfile
);

// Get user settings
router.get('/settings', authenticate, userController.getSettings);

// Update user settings
router.put('/settings',
  authenticate,
  [
    body('theme').optional().isIn(['light', 'dark', 'system']),
    body('language').optional().isString(),
    body('notifications.email').optional().isBoolean(),
    body('notifications.push').optional().isBoolean(),
    body('defaultModel.claude').optional().isString(),
    body('defaultModel.grok').optional().isString(),
    body('systemPrompts.claude').optional().isString().isLength({ max: 2000 }),
    body('systemPrompts.grok').optional().isString().isLength({ max: 2000 }),
    body('aiRoles.claude').optional().isString().isLength({ max: 50 }),
    body('aiRoles.grok').optional().isString().isLength({ max: 50 }),
    body('brainstormPrompts.claude').optional().isString().isLength({ max: 2000 }),
    body('brainstormPrompts.grok').optional().isString().isLength({ max: 2000 })
  ],
  userController.updateSettings
);

// Get user projects
router.get('/projects', authenticate, userController.getProjects);

// Upload avatar
router.post('/avatar', authenticate, userController.uploadAvatar);

// Delete avatar
router.delete('/avatar', authenticate, userController.deleteAvatar);

// Get usage statistics
router.get('/usage', authenticate, userController.getUsage);

// Subscription management
router.post('/subscription/change',
  authenticate,
  [
    body('planId').notEmpty().isString()
  ],
  userController.changeSubscription
);

router.post('/subscription/cancel', authenticate, userController.cancelSubscription);

router.get('/subscription', authenticate, userController.getSubscription);

// Reset password
router.post('/reset-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
  ],
  userController.resetPassword
);

// Enable 2FA
router.post('/2fa/enable', authenticate, userController.enable2FA);

// Disable 2FA
router.post('/2fa/disable', 
  authenticate,
  [
    body('code').notEmpty()
  ],
  userController.disable2FA
);

// Verify 2FA
router.post('/2fa/verify',
  authenticate,
  [
    body('code').notEmpty()
  ],
  userController.verify2FA
);

// Delete account
router.delete('/account',
  authenticate,
  [
    body('password').notEmpty(),
    body('confirmation').equals('DELETE')
  ],
  userController.deleteAccount
);

module.exports = router;