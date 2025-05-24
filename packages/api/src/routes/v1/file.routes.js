const router = require('express').Router();
const { param, body } = require('express-validator');
const fileController = require('../../controllers/file.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');

// Routes
router.use(authenticate);

router.post('/upload', uploadMiddleware.single('file'), fileController.uploadFile);
router.post('/upload-url', body('fileName').notEmpty(), body('fileType').notEmpty(), fileController.getUploadUrl);
router.get('/:id', param('id').notEmpty(), fileController.getFile);
router.delete('/:id', param('id').notEmpty(), fileController.deleteFile);
router.get('/:id/download', param('id').notEmpty(), fileController.downloadFile);
router.post('/process', uploadMiddleware.single('file'), fileController.processFile);

module.exports = router;