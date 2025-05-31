// Исправленная версия packages/api/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');

// Import routes
const v1Routes = require('./routes/v1');

module.exports = (app) => {
  // Security middleware
  app.use(helmet());
  app.use(compression());
  app.use(mongoSanitize());

  // CORS configuration
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      process.env.ADMIN_URL || 'http://localhost:3001'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/v1', v1Routes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found'
      }
    });
  });

  // Error handling middleware
  app.use(errorMiddleware);

  return app;
};