const { validationResult } = require('express-validator');
const { apiResponse } = require('../utils/apiResponse');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json(
      apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: formattedErrors
      })
    );
  }
  
  next();
};

// Custom validators
const customValidators = {
  // Check if string is valid MongoDB ObjectId
  isObjectId: (value) => {
    if (!value) return false;
    return /^[0-9a-fA-F]{24}$/.test(value);
  },

  // Check if password meets requirements
  isStrongPassword: (value) => {
    if (!value) return false;
    
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumbers = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*]/.test(value);
    
    return (
      value.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar
    );
  },

  // Check if email is from allowed domain
  isAllowedEmailDomain: (value, allowedDomains = []) => {
    if (!value) return false;
    
    const domain = value.split('@')[1];
    if (allowedDomains.length === 0) return true;
    
    return allowedDomains.includes(domain);
  },

  // Check file type
  isAllowedFileType: (file, allowedTypes) => {
    if (!file) return false;
    return allowedTypes.includes(file.mimetype);
  },

  // Check file size
  isWithinFileSize: (file, maxSize) => {
    if (!file) return false;
    return file.size <= maxSize;
  }
};

// Sanitizers
const sanitizers = {
  // Clean HTML to prevent XSS
  sanitizeHtml: (value) => {
    if (!value) return value;
    
    // Basic HTML sanitization - in production use a library like DOMPurify
    return value
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Normalize email
  normalizeEmail: (value) => {
    if (!value) return value;
    return value.toLowerCase().trim();
  },

  // Clean filename
  sanitizeFilename: (value) => {
    if (!value) return value;
    
    // Remove special characters except dots and hyphens
    return value.replace(/[^a-zA-Z0-9.-]/g, '_');
  },

  // Trim and remove extra spaces
  cleanString: (value) => {
    if (!value) return value;
    return value.trim().replace(/\s+/g, ' ');
  }
};

// Common validation chains
const commonValidations = {
  email: {
    notEmpty: {
      errorMessage: 'Email is required'
    },
    isEmail: {
      errorMessage: 'Invalid email format'
    },
    normalizeEmail: true
  },

  password: {
    notEmpty: {
      errorMessage: 'Password is required'
    },
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters'
    },
    custom: {
      options: customValidators.isStrongPassword,
      errorMessage: 'Password must contain uppercase, lowercase, numbers and special characters'
    }
  },

  objectId: {
    notEmpty: {
      errorMessage: 'ID is required'
    },
    custom: {
      options: customValidators.isObjectId,
      errorMessage: 'Invalid ID format'
    }
  },

  pagination: {
    page: {
      optional: true,
      isInt: {
        options: { min: 1 },
        errorMessage: 'Page must be a positive integer'
      },
      toInt: true
    },
    limit: {
      optional: true,
      isInt: {
        options: { min: 1, max: 100 },
        errorMessage: 'Limit must be between 1 and 100'
      },
      toInt: true
    }
  }
};

module.exports = {
  handleValidationErrors,
  customValidators,
  sanitizers,
  commonValidations
};