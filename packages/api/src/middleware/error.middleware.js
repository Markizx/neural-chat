const { apiResponse } = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Error handling middleware
const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error = {
      code: 'INVALID_ID',
      message: 'Resource not found',
      statusCode: 404
    };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      code: 'DUPLICATE_FIELD',
      message: `${field} already exists`,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    
    error = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      code: 'INVALID_TOKEN',
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      code: 'TOKEN_EXPIRED',
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'FILE_TOO_LARGE') {
      error = {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds limit',
        statusCode: 400
      };
    } else {
      error = {
        code: 'FILE_UPLOAD_ERROR',
        message: err.message,
        statusCode: 400
      };
    }
  }

  // Rate limit error
  if (err.statusCode === 429) {
    error = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: err.message || 'Too many requests',
      statusCode: 429
    };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || 'Internal server error';
  const code = error.code || 'INTERNAL_ERROR';

  res.status(statusCode).json(
    apiResponse(false, null, {
      code,
      message,
      details: error.details,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        originalError: err
      })
    })
  );
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = errorMiddleware;