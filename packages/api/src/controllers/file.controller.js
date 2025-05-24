const storageService = require('../services/storage.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Upload file
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_FILE',
        message: 'No file uploaded'
      }));
    }

    const file = {
      id: req.file.key || req.file.filename,
      name: req.file.originalname,
      url: req.file.location || req.file.path,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    res.json(apiResponse(true, { file }));
  } catch (error) {
    next(error);
  }
};

// Get pre-signed upload URL
exports.getUploadUrl = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { fileName, fileType } = req.body;

    const uploadData = await storageService.getPresignedUploadUrl(
      fileName,
      fileType,
      req.user._id
    );

    res.json(apiResponse(true, uploadData));
  } catch (error) {
    next(error);
  }
};

// Get file
exports.getFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // In a real app, you'd check file ownership/permissions here
    const fileUrl = await storageService.getFileUrl(id);

    res.json(apiResponse(true, { 
      url: fileUrl,
      expiresIn: 3600 // 1 hour
    }));
  } catch (error) {
    next(error);
  }
};

// Delete file
exports.deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // In a real app, you'd check file ownership/permissions here
    await storageService.deleteFile(id);

    res.json(apiResponse(true, { 
      message: 'File deleted successfully' 
    }));
  } catch (error) {
    next(error);
  }
};

// Download file
exports.downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get file URL
    const fileUrl = await storageService.getFileUrl(id);

    // Redirect to file URL
    res.redirect(fileUrl);
  } catch (error) {
    next(error);
  }
};

// Process file (OCR, text extraction, etc.)
exports.processFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'NO_FILE',
        message: 'No file uploaded'
      }));
    }

    const { type } = req.body;
    let result;

    switch (type) {
      case 'ocr':
        // TODO: Implement OCR using AWS Textract or similar
        result = { text: 'OCR not implemented' };
        break;
      
      case 'extract-text':
        // TODO: Implement text extraction from PDFs
        result = { text: 'Text extraction not implemented' };
        break;
      
      case 'analyze-image':
        // TODO: Implement image analysis
        result = { analysis: 'Image analysis not implemented' };
        break;
      
      default:
        return res.status(400).json(apiResponse(false, null, {
          code: 'INVALID_PROCESS_TYPE',
          message: 'Invalid process type'
        }));
    }

    res.json(apiResponse(true, result));
  } catch (error) {
    next(error);
  }
};