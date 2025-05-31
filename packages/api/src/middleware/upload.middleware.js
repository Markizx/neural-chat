const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const { apiResponse } = require('../utils/apiResponse');

// Ensure uploads directory exists for development
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// Configure AWS S3 (only if credentials are provided)
let s3 = null;
let s3Available = false;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET) {
  try {
    s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    s3Available = true;
    console.log('☁️ AWS S3 configured for file storage');
  } catch (error) {
    console.warn('⚠️ AWS S3 configuration failed, falling back to local storage:', error.message);
  }
} else {
  console.log('📁 Using local file storage (AWS credentials not provided)');
}

// Allowed file types
const allowedMimeTypes = {
  images: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff', 'image/ico'
  ],
  documents: [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf'
  ],
  text: [
    'text/plain', 'text/markdown', 'text/csv', 'text/tab-separated-values',
    'application/json', 'application/xml', 'text/xml',
    'text/html', 'text/css', 'text/javascript', 'application/javascript',
    'text/typescript', 'application/typescript'
  ],
  code: [
    'text/javascript', 'application/javascript',
    'text/typescript', 'application/typescript', 
    'text/python', 'application/x-python-code',
    'text/html', 'text/css', 'text/scss', 'text/sass', 'text/less',
    'application/x-php', 'text/x-php',
    'text/x-java-source', 'text/x-c', 'text/x-c++', 'text/x-csharp',
    'application/x-ruby', 'text/x-ruby',
    'application/x-go', 'text/x-go',
    'application/x-rust', 'text/x-rust',
    'text/x-sql', 'application/sql'
  ],
  archives: [
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/x-rar',
    'application/x-7z-compressed',
    'application/x-tar', 'application/gzip'
  ],
  other: [
    'application/octet-stream', // Для файлов без расширения
    'text/x-readme', // README файлы
    'application/x-yaml', 'text/yaml', 'text/x-yaml' // YAML файлы
  ]
};

// File filter
const fileFilter = (allowedTypes = [
  ...allowedMimeTypes.images, 
  ...allowedMimeTypes.documents, 
  ...allowedMimeTypes.text,
  ...allowedMimeTypes.code,
  ...allowedMimeTypes.archives,
  ...allowedMimeTypes.other
]) => {
  return (req, file, cb) => {
    console.log('🔍 File filter check:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      allowed: allowedTypes.includes(file.mimetype)
    });
    
    // Специальная обработка для файлов без расширения или с неопределенным MIME типом
    const filename = file.originalname.toLowerCase();
    const isReadmeFile = filename.includes('readme') || filename === 'readme';
    const isConfigFile = filename.includes('config') || filename.includes('.env') || filename.includes('dockerfile');
    const isCodeFile = /\.(js|ts|jsx|tsx|py|java|cpp|c|h|php|rb|go|rs|sql|html|css|scss|sass|less|json|xml|yaml|yml|md|txt)$/i.test(filename);
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else if (isReadmeFile || isConfigFile || isCodeFile || file.mimetype === 'application/octet-stream') {
      // Разрешаем файлы по расширению, даже если MIME тип неопределен
      console.log('✅ File allowed by extension/name:', filename);
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`), false);
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
const s3Storage = s3Available ? multerS3({
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
}) : null;

// Local storage configuration (for development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
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
    storage = (process.env.NODE_ENV === 'production' && s3Available) ? s3Storage : localStorage,
    fileSize = fileSizeLimits.default,
    allowedTypes = [...allowedMimeTypes.images, ...allowedMimeTypes.documents, ...allowedMimeTypes.text]
  } = options;

  // Fallback to localStorage if S3 storage is not available
  const finalStorage = storage || localStorage;

  return multer({
    storage: finalStorage,
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