const router = require('express').Router();
const { body, param, query } = require('express-validator');
const brainstormController = require('../../controllers/brainstorm.controller');
const { authenticate, requireSubscription } = require('../../middleware/auth.middleware');

// Validation rules
const startBrainstormValidation = [
  body('topic').notEmpty().trim(),
  body('description').optional().trim(),
  body('claudeModel').optional().isIn(['claude-4-sonnet', 'claude-4-opus', 'claude-3.7-sonnet', 'claude-3-haiku-20240307', 'claude-3-opus-20240229']),
  body('grokModel').optional().isIn(['grok-3', 'grok-2-1212', 'grok-2-vision-1212']),
  body('settings.format').optional().isIn(['brainstorm', 'debate', 'analysis', 'creative']),
  body('settings.maxTurns').optional().isInt({ min: 5, max: 50 }),
  body('settings.turnDuration').optional().isInt({ min: 30, max: 120 })
];

const sendMessageValidation = [
  param('id').isMongoId(),
  body('content').optional().trim(),
  body('attachments').optional().isArray(),
  // Custom validation: content OR attachments must be present
  body().custom((value) => {
    const hasContent = value.content && value.content.trim().length > 0;
    const hasAttachments = value.attachments && Array.isArray(value.attachments) && value.attachments.length > 0;
    
    if (!hasContent && !hasAttachments) {
      throw new Error('Content or attachments must be provided');
    }
    
    // Validate attachments structure if present
    if (hasAttachments) {
      for (let i = 0; i < value.attachments.length; i++) {
        const attachment = value.attachments[i];
        // Логирование только при проблемах
        if (!attachment?.name || !attachment?.data || !attachment?.mimeType) {
          console.log(`🔍 Проблема с attachment ${i}:`, {
            hasName: !!attachment?.name,
            hasData: !!attachment?.data,
            hasMimeType: !!attachment?.mimeType,
            mimeTypeValue: attachment?.mimeType,
            name: attachment?.name
          });
        }
        
        if (!attachment || typeof attachment !== 'object') {
          throw new Error(`Attachment ${i} must be an object`);
        }
        if (!attachment.name || !attachment.data || !attachment.mimeType) {
          throw new Error(`Attachment ${i} missing required fields: name, data, mimeType`);
        }
      }
    }
    
    return true;
  })
];

// Routes
router.use(authenticate);
// router.use(requireSubscription('pro', 'business')); // Temporarily disabled for testing

router.post('/', startBrainstormValidation, brainstormController.startBrainstorm);
router.post('/start', startBrainstormValidation, brainstormController.startBrainstorm);
router.get('/sessions', brainstormController.getBrainstormSessions);
router.get('/:id', param('id').isMongoId(), brainstormController.getBrainstormSession);
router.delete('/:id', param('id').isMongoId(), brainstormController.deleteBrainstormSession);
router.post('/:id/message', sendMessageValidation, brainstormController.sendBrainstormMessage);
router.post('/:id/continue', param('id').isMongoId(), brainstormController.continueAIDiscussion);
router.post('/:id/pause', param('id').isMongoId(), brainstormController.pauseBrainstorm);
router.post('/:id/resume', param('id').isMongoId(), brainstormController.resumeBrainstorm);
router.post('/:id/stop', param('id').isMongoId(), brainstormController.stopBrainstorm);
router.get('/:id/summary', param('id').isMongoId(), brainstormController.getSummary);
router.get('/:id/export', param('id').isMongoId(), query('format').optional().isIn(['json', 'markdown']), brainstormController.exportBrainstorm);

module.exports = router;