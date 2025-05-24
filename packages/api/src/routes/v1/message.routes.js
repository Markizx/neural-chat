const router = require('express').Router();
const { body, param } = require('express-validator');
const messageController = require('../../controllers/message.controller');
const { authenticate, checkUsageLimit } = require('../../middleware/auth.middleware');

// Validation rules
const sendMessageValidation = [
  param('chatId').isMongoId(),
  body('content').notEmpty().trim(),
  body('attachments').optional().isArray()
];

const updateMessageValidation = [
  param('id').isMongoId(),
  body('content').notEmpty().trim()
];

const feedbackValidation = [
  param('id').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
];

// Routes
router.use(authenticate);

// Chat messages
router.get('/chats/:chatId/messages', param('chatId').isMongoId(), messageController.getMessages);
router.post('/chats/:chatId/messages', sendMessageValidation, checkUsageLimit, messageController.sendMessage);

// Individual messages
router.get('/:id', param('id').isMongoId(), messageController.getMessage);
router.put('/:id', updateMessageValidation, messageController.updateMessage);
router.delete('/:id', param('id').isMongoId(), messageController.deleteMessage);
router.post('/:id/feedback', feedbackValidation, messageController.addFeedback);
router.post('/:id/regenerate', param('id').isMongoId(), checkUsageLimit, messageController.regenerateMessage);

module.exports = router;