const Project = require('../models/project.model');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const storageService = require('../services/storage.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Get all projects
exports.getProjects = async (req, res, next) => {
  try {
    const { archived = false } = req.query;

    const projects = await Project.find({
      $or: [
        { userId: req.user._id },
        { 'collaborators.userId': req.user._id }
      ],
      isArchived: archived === 'true'
    })
    .populate('userId', 'name email avatar')
    .populate('collaborators.userId', 'name email avatar')
    .sort({ updatedAt: -1 });

    res.json(apiResponse(true, { projects }));
  } catch (error) {
    next(error);
  }
};

// Create project
exports.createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { name, description, color, icon } = req.body;

    const project = new Project({
      userId: req.user._id,
      name,
      description,
      color,
      icon
    });

    await project.save();
    await project.populate('userId', 'name email avatar');

    res.status(201).json(apiResponse(true, { project }));
  } catch (error) {
    next(error);
  }
};

// Get project by ID
exports.getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate('userId', 'name email avatar')
      .populate('collaborators.userId', 'name email avatar');

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Check permission
    if (!project.checkPermission(req.user._id)) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'You do not have access to this project'
      }));
    }

    res.json(apiResponse(true, { project }));
  } catch (error) {
    next(error);
  }
};

// Update project
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, settings } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Check permission (need editor role)
    if (!project.checkPermission(req.user._id, 'editor')) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'You need editor permissions to update this project'
      }));
    }

    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (color !== undefined) project.color = color;
    if (icon !== undefined) project.icon = icon;
    if (settings !== undefined) {
      project.settings = { ...project.settings.toObject(), ...settings };
    }

    await project.save();
    await project.populate('userId', 'name email avatar');
    await project.populate('collaborators.userId', 'name email avatar');

    res.json(apiResponse(true, { project }));
  } catch (error) {
    next(error);
  }
};

// Delete project
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Only owner can delete
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Only the project owner can delete it'
      }));
    }

    // Delete all files from storage
    for (const file of project.files) {
      await storageService.deleteFile(file.url);
    }

    // Remove project from all chats
    await Chat.updateMany(
      { projectId: id },
      { $unset: { projectId: 1 } }
    );

    // Delete project
    await project.deleteOne();

    res.json(apiResponse(true, { message: 'Project deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

// Upload files
exports.uploadFiles = async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = req.files;

    console.log('📁 Upload files request:', {
      projectId: id,
      filesCount: files?.length || 0,
      files: files?.map(f => ({ name: f.originalname, size: f.size, type: f.mimetype }))
    });

    if (!files || files.length === 0) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_FILES',
        message: 'No files uploaded'
      }));
    }

    let project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Check permission (need editor role)
    if (!project.checkPermission(req.user._id, 'editor')) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'You need editor permissions to upload files'
      }));
    }

    // Check if project needs migration (has old schema)
    let needsMigration = false;
    try {
      // Try to access files field
      if (project.files && project.files.length > 0) {
        // Check if first file is a string (old schema)
        if (typeof project.files[0] === 'string') {
          needsMigration = true;
        }
      }
    } catch (e) {
      needsMigration = true;
    }

    if (needsMigration) {
      console.log('🔧 Project needs schema migration');
      
      try {
        // Save project data including existing files
        const projectData = {
          userId: project.userId,
          name: project.name,
          description: project.description,
          color: project.color,
          icon: project.icon,
          collaborators: project.collaborators,
          settings: project.settings,
          stats: project.stats,
          isArchived: project.isArchived,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        };
        
        // Save existing files if any (convert from old format if needed)
        const existingFiles = [];
        if (project.files && Array.isArray(project.files)) {
          project.files.forEach((file, index) => {
            if (typeof file === 'object' && file.id) {
              // Already in correct format
              existingFiles.push(file);
            }
          });
        }
        
        // Delete the old project document
        await Project.deleteOne({ _id: id });
        console.log('🗑️ Deleted old project document');
        
        // Create new project with correct schema
        project = new Project({
          _id: id,
          ...projectData,
          files: existingFiles // Preserve existing files
        });
        
        await project.save();
        console.log('✅ Recreated project with correct schema, preserved', existingFiles.length, 'files');
        
      } catch (migrationError) {
        console.log('⚠️ Migration failed:', migrationError.message);
        return res.status(500).json(apiResponse(false, null, {
          code: 'MIGRATION_ERROR',
          message: 'Failed to migrate project schema. Please create a new project.'
        }));
      }
    }

    // Add files to project
    const uploadedFiles = [];
    for (const file of files) {
      const fileData = {
        name: file.originalname,
        url: file.location || `/uploads/${file.filename}`, // S3 location или локальный путь
        type: file.mimetype,
        size: file.size
      };
      const addedFile = project.addFile(fileData);
      uploadedFiles.push(addedFile);
      
      console.log('✅ File added to project:', {
        name: fileData.name,
        url: fileData.url,
        size: fileData.size
      });
    }

    await project.save();

    // Get storage info for debugging
    const storageInfo = storageService.getStorageInfo();
    console.log('💾 Storage info:', storageInfo);

    res.json(apiResponse(true, {
      files: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`,
      storageType: storageInfo.type
    }));
  } catch (error) {
    console.error('❌ Upload files error:', error);
    next(error);
  }
};

// Delete file
exports.deleteFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Check permission (need editor role)
    if (!project.checkPermission(req.user._id, 'editor')) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'You need editor permissions to delete files'
      }));
    }

    // Find file
    const file = project.files.find(f => f.id === fileId);
    if (!file) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'FILE_NOT_FOUND',
        message: 'File not found'
      }));
    }

    // Delete from storage
    await storageService.deleteFile(file.url);

    // Remove from project
    project.removeFile(fileId);
    await project.save();

    res.json(apiResponse(true, { message: 'File deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

// Add collaborator
exports.addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Only owner can add collaborators
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Only the project owner can add collaborators'
      }));
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'USER_NOT_FOUND',
        message: 'User not found with this email'
      }));
    }

    // Can't add owner as collaborator
    if (user._id.toString() === project.userId.toString()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_COLLABORATOR',
        message: 'Cannot add project owner as collaborator'
      }));
    }

    // Add collaborator
    project.addCollaborator(user._id, role);
    await project.save();
    await project.populate('collaborators.userId', 'name email avatar');

    res.json(apiResponse(true, {
      project,
      message: 'Collaborator added successfully'
    }));
  } catch (error) {
    next(error);
  }
};

// Remove collaborator
exports.removeCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'PROJECT_NOT_FOUND',
        message: 'Project not found'
      }));
    }

    // Only owner can remove collaborators
    if (project.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(apiResponse(false, null, {
        code: 'FORBIDDEN',
        message: 'Only the project owner can remove collaborators'
      }));
    }

    // Remove collaborator
    project.removeCollaborator(userId);
    await project.save();

    res.json(apiResponse(true, { message: 'Collaborator removed successfully' }));
  } catch (error) {
    next(error);
  }
};