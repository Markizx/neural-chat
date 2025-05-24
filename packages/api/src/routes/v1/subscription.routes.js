const router = require('express').Router();
const { body } = require('express-validator');
const subscriptionController = require('../../controllers/subscription.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// Public webhook endpoints (no auth)
router.post('/webhook/stripe', subscriptionController.stripeWebhook);
router.post('/webhook/apple', subscriptionController.appleWebhook);
router.post('/webhook/google', subscriptionController.googleWebhook);

// Mobile receipt verification
router.post('/verify-receipt/apple', body('receipt').notEmpty(), subscriptionController.verifyAppleReceipt);
router.post('/verify-receipt/google', body('purchaseToken').notEmpty(), subscriptionController.verifyGoogleReceipt);

// Authenticated routes
router.use(authenticate);

router.get('/plans', subscriptionController.getPlans);
router.post('/create-checkout', body('planId').notEmpty(), subscriptionController.createCheckout);
router.post('/create-portal', subscriptionController.createPortal);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/resume', subscriptionController.resumeSubscription);
router.post('/change-plan', body('planId').notEmpty(), subscriptionController.changePlan);
router.get('/status', subscriptionController.getSubscriptionStatus);
router.post('/restore-purchases', subscriptionController.restorePurchases);

module.exports = router;