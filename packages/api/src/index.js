// Исправленная версия packages/api/src/index.js
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const express = require('express');

const PORT = process.env.API_PORT || 5000;

// Create express app first
const app = express();

// Initialize Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Add io to app instance so it can be used in middleware
app.set('io', io);

// Middleware to add io to every request - MUST be before loading routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Now load routes and middleware - they will have access to req.io
require('./app')(app);

// Load WebSocket handlers
const { initWebSocket } = require('./websocket');

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('MongoDB connected');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected');

    // Initialize WebSocket handlers after Redis is connected
    initWebSocket(io);

    // Import and apply rate limiters after Redis is connected
    const { defaultLimiter } = require('./middleware/rateLimiter.middleware');
    app.use('/api/', defaultLimiter);

    // Start listening
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});