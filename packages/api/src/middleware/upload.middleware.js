const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const path = require('path');
const { apiResponse } = require('../utils/apiResponse');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Allowed file types
const allowedMimeTypes = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  text: ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml'],
  code: ['text/javascript', 'text/typescript', 'text/python', 'text/html', 'text/css'],
  archives: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

// File filter
const fileFilter = (allowedTypes = [...allowedMimeTypes.images, ...allowedMimeTypes.documents, ...allowedMimeTypes.text]) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

// File size limits
const fileSizeLimits = {
  images: 10 * 1024 * 1024, // 10MB
  documents: 50 * 1024 * 1024, // 50MB
  default: 25 * 1024 * 1024 // 25MB
};

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET,
  acl: 'private',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const userId = req.user._id.toString();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const key = `users/${userId}/${timestamp}-${randomString}${extension}`;
    cb(null, key);
  },
  metadata: (req, file, cb) => {
    cb(null, {
      fieldName: file.fieldname,
      originalName: file.originalname,
      uploadedBy: req.user._id.toString()
    });
  }
});

// Local storage configuration (for development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const userId = req.user._id.toString();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(file.originalname);
    const filename = `${userId}-${timestamp}-${randomString}${extension}`;
    cb(null, filename);
  }
});

// Create multer instance
const createUploader = (options = {}) => {
  const {
    storage = process.env.NODE_ENV === 'production' ? s3Storage : localStorage,
    fileSize = fileSizeLimits.default,
    allowedTypes = [...allowedMimeTypes.images, ...allowedMimeTypes.documents, ...allowedMimeTypes.text]
  } = options;

  return multer({
    storage,
    limits: {
      fileSize
    },
    fileFilter: fileFilter(allowedTypes)
  });
};

// Upload middleware instances
const uploadMiddleware = {
  // Single file upload
  single: (fieldName = 'file', options = {}) => {
    const uploader = createUploader(options);
    return uploader.single(fieldName);
  },

  // Multiple files upload
  array: (fieldName = 'files', maxCount = 10, options = {}) => {
    const uploader = createUploader(options);
    return uploader.array(fieldName, maxCount);
  },

  // Multiple fields upload
  fields: (fields, options = {}) => {
    const uploader = createUploader(options);
    return uploader.fields(fields);
  },

  // Image upload
  image: (fieldName = 'image') => {
    const uploader = createUploader({
      fileSize: fileSizeLimits.images,
      allowedTypes: allowedMimeTypes.images
    });
    return uploader.single(fieldName);
  },

  // Document upload
  document: (fieldName = 'document') => {
    const uploader = createUploader({
      fileSize: fileSizeLimits.documents,
      allowedTypes: allowedMimeTypes.documents
    });
    return uploader.single(fieldName);
  },

  // Avatar upload
  avatar: (fieldName = 'avatar') => {
    const uploader = createUploader({
      fileSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    return uploader.single(fieldName);
  }
};

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json(
        apiResponse(false, null, {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds the allowed limit'
        })
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json(
        apiResponse(false, null, {
          code: 'TOO_MANY_FILES',
          message: 'Too many files uploaded'
        })
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json(
        apiResponse(false, null, {
          code: 'UNEXPECTED_FIELD',
          message: 'Unexpected file field'
        })
      );
    }
  }

  if (err.message && err.message.includes('File type not allowed')) {
    return res.status(400).json(
      apiResponse(false, null, {
        code: 'INVALID_FILE_TYPE',
        message: err.message
      })
    );
  }

  next(err);
};

module.exports = {
  uploadMiddleware,
  handleUploadError,
  allowedMimeTypes,
  fileSizeLimits
};