const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const handlers = require('./handlers');
const logger = require('../utils/logger');

const activeConnections = new Map();

const initWebSocket = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || user.status !== 'active') {
        return next(new Error('Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected via WebSocket`);
    
    // Store connection
    activeConnections.set(socket.userId, socket.id);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Handle chat events
    socket.on('chat:join', (chatId) => handlers.handleJoinChat(socket, chatId));
    socket.on('chat:leave', (chatId) => handlers.handleLeaveChat(socket, chatId));
    socket.on('chat:typing', (data) => handlers.handleTyping(socket, data));
    socket.on('chat:stop-typing', (data) => handlers.handleStopTyping(socket, data));

    // Handle message events
    socket.on('message:send', (data) => handlers.handleSendMessage(io, socket, data));
    socket.on('message:edit', (data) => handlers.handleEditMessage(io, socket, data));
    socket.on('message:delete', (data) => handlers.handleDeleteMessage(io, socket, data));

    // Handle brainstorm events
    socket.on('brainstorm:join', (sessionId) => handlers.handleJoinBrainstorm(socket, sessionId));
    socket.on('brainstorm:leave', (sessionId) => handlers.handleLeaveBrainstorm(socket, sessionId));
    socket.on('brainstorm:message', (data) => handlers.handleBrainstormMessage(io, socket, data));

    // Handle presence events
    socket.on('presence:online', () => handlers.handlePresenceOnline(io, socket));
    socket.on('presence:away', () => handlers.handlePresenceAway(io, socket));

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
      activeConnections.delete(socket.userId);
      handlers.handleDisconnect(io, socket);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`WebSocket error for user ${socket.userId}:`, error);
    });
  });

  // Utility functions
  io.isUserOnline = (userId) => {
    return activeConnections.has(userId.toString());
  };

  io.sendToUser = (userId, event, data) => {
    const socketId = activeConnections.get(userId.toString());
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  };

  io.getOnlineUsers = () => {
    return Array.from(activeConnections.keys());
  };

  return io;
};

module.exports = { initWebSocket };