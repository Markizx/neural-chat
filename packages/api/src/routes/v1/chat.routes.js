const router = require('express').Router();
const { body, query, param } = require('express-validator');
const chatController = require('../../controllers/chat.controller');
const { authenticate, checkUsageLimit } = require('../../middleware/auth.middleware');

// Validation rules
const createChatValidation = [
  body('type').isIn(['claude', 'grok', 'brainstorm']),
  body('model').notEmpty(),
  body('title').optional().trim(),
  body('projectId').optional().isMongoId()
];

const updateChatValidation = [
  param('id').isMongoId(),
  body('title').optional().trim(),
  body('tags').optional().isArray(),
  body('projectId').optional().isMongoId()
];

// Routes
router.use(authenticate); // All chat routes require authentication

router.get('/', chatController.getChats);
router.post('/', createChatValidation, checkUsageLimit, chatController.createChat);
router.get('/search', chatController.searchChats);
router.get('/shared/:shareId', chatController.getSharedChat);
router.get('/:id', param('id').isMongoId(), chatController.getChat);
router.put('/:id', updateChatValidation, chatController.updateChat);
router.delete('/:id', param('id').isMongoId(), chatController.deleteChat);
router.post('/:id/archive', param('id').isMongoId(), chatController.archiveChat);
router.post('/:id/pin', param('id').isMongoId(), chatController.pinChat);
router.post('/:id/share', param('id').isMongoId(), chatController.shareChat);

module.exports = router;