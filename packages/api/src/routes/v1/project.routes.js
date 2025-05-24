const router = require('express').Router();
const { body, param } = require('express-validator');
const projectController = require('../../controllers/project.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { uploadMiddleware } = require('../../middleware/upload.middleware');

// Validation rules
const createProjectValidation = [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional()
];

const updateProjectValidation = [
  param('id').isMongoId(),
  body('name').optional().trim(),
  body('description').optional().trim(),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i),
  body('icon').optional()
];

const addCollaboratorValidation = [
  param('id').isMongoId(),
  body('email').isEmail(),
  body('role').isIn(['editor', 'viewer'])
];

// Routes
router.use(authenticate);

router.get('/', projectController.getProjects);
router.post('/', createProjectValidation, projectController.createProject);
router.get('/:id', param('id').isMongoId(), projectController.getProject);
router.put('/:id', updateProjectValidation, projectController.updateProject);
router.delete('/:id', param('id').isMongoId(), projectController.deleteProject);

// Files
router.post('/:id/files', 
  param('id').isMongoId(),
  uploadMiddleware.array('files', 10),
  projectController.uploadFiles
);
router.delete('/:id/files/:fileId', 
  param('id').isMongoId(),
  param('fileId').notEmpty(),
  projectController.deleteFile
);

// Collaborators
router.post('/:id/collaborators', addCollaboratorValidation, projectController.addCollaborator);
router.delete('/:id/collaborators/:userId', 
  param('id').isMongoId(),
  param('userId').isMongoId(),
  projectController.removeCollaborator
);

module.exports = router;