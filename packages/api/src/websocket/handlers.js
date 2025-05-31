const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const BrainstormSession = require('../models/brainstorm.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Chat handlers
exports.handleJoinChat = async (socket, chatId) => {
  try {
    // Verify user has access to chat
    const chat = await Chat.findOne({
      _id: chatId,
      $or: [
        { userId: socket.userId },
        { 'sharing.sharedWith': socket.userId }
      ]
    });

    if (!chat) {
      socket.emit('error', { message: 'Chat not found or access denied' });
      return;
    }

    socket.join(`chat:${chatId}`);
    socket.emit('chat:joined', { chatId });
    
    // Notify others in chat
    socket.to(`chat:${chatId}`).emit('user:joined', {
      userId: socket.userId,
      chatId
    });
  } catch (error) {
    logger.error('Error joining chat:', error);
    socket.emit('error', { message: 'Failed to join chat' });
  }
};

exports.handleLeaveChat = async (socket, chatId) => {
  socket.leave(`chat:${chatId}`);
  socket.to(`chat:${chatId}`).emit('user:left', {
    userId: socket.userId,
    chatId
  });
};

exports.handleTyping = async (socket, { chatId }) => {
  socket.to(`chat:${chatId}`).emit('user:typing', {
    userId: socket.userId,
    chatId
  });
};

exports.handleStopTyping = async (socket, { chatId }) => {
  socket.to(`chat:${chatId}`).emit('user:stop-typing', {
    userId: socket.userId,
    chatId
  });
};

// Message handlers
exports.handleSendMessage = async (io, socket, data) => {
  try {
    const { chatId, content, attachments } = data;

    // Verify access
    const chat = await Chat.findOne({
      _id: chatId,
      userId: socket.userId
    });

    if (!chat) {
      socket.emit('error', { message: 'Chat not found' });
      return;
    }

    // Create message
    const message = new Message({
      chatId,
      userId: socket.userId,
      role: 'user',
      content,
      attachments
    });

    await message.save();

    // Emit to all users in chat
    io.to(`chat:${chatId}`).emit('message:new', {
      message: message.toJSON()
    });

    // Update chat metadata
    chat.updateMetadata();
    await chat.save();
  } catch (error) {
    logger.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
};

exports.handleEditMessage = async (io, socket, data) => {
  try {
    const { messageId, content } = data;

    const message = await Message.findOne({
      _id: messageId,
      userId: socket.userId,
      role: 'user'
    });

    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    io.to(`chat:${message.chatId}`).emit('message:edited', {
      message: message.toJSON()
    });
  } catch (error) {
    logger.error('Error editing message:', error);
    socket.emit('error', { message: 'Failed to edit message' });
  }
};

exports.handleDeleteMessage = async (io, socket, data) => {
  try {
    const { messageId } = data;

    const message = await Message.findOne({
      _id: messageId,
      userId: socket.userId
    });

    if (!message) {
      socket.emit('error', { message: 'Message not found' });
      return;
    }

    message.softDelete();
    await message.save();

    io.to(`chat:${message.chatId}`).emit('message:deleted', {
      messageId,
      chatId: message.chatId
    });
  } catch (error) {
    logger.error('Error deleting message:', error);
    socket.emit('error', { message: 'Failed to delete message' });
  }
};

// Brainstorm handlers
exports.handleJoinBrainstorm = async (socket, sessionId) => {
  try {
    console.log('🔍 Brainstorm join attempt:', { sessionId, userId: socket.userId });
    
    const session = await BrainstormSession.findOne({
      _id: sessionId,
      userId: socket.userId
    });

    console.log('🔍 Session found:', !!session);
    
    if (!session) {
      console.log('❌ Session not found for:', { sessionId, userId: socket.userId });
      socket.emit('error', { message: 'Brainstorm session not found' });
      return;
    }

    socket.join(`brainstorm:${sessionId}`);
    socket.emit('brainstorm:joined', { sessionId });
    console.log('✅ Successfully joined brainstorm:', sessionId);
  } catch (error) {
    logger.error('Error joining brainstorm:', error);
    socket.emit('error', { message: 'Failed to join brainstorm' });
  }
};

exports.handleLeaveBrainstorm = async (socket, sessionId) => {
  socket.leave(`brainstorm:${sessionId}`);
};

exports.handleBrainstormMessage = async (io, socket, data) => {
  try {
    const { sessionId, message } = data;

    // Emit to all users in brainstorm session
    io.to(`brainstorm:${sessionId}`).emit('brainstorm:message', {
      sessionId,
      message
    });
  } catch (error) {
    logger.error('Error handling brainstorm message:', error);
    socket.emit('error', { message: 'Failed to handle brainstorm message' });
  }
};

// Presence handlers
exports.handlePresenceOnline = async (io, socket) => {
  socket.user.metadata.lastActivity = new Date();
  await socket.user.save();

  // Notify friends/contacts
  io.emit('user:online', {
    userId: socket.userId
  });
};

exports.handlePresenceAway = async (io, socket) => {
  io.emit('user:away', {
    userId: socket.userId
  });
};

exports.handleDisconnect = async (io, socket) => {
  // Leave all rooms
  const rooms = Array.from(socket.rooms);
  rooms.forEach(room => {
    if (room !== socket.id) {
      socket.leave(room);
    }
  });

  // Notify others
  io.emit('user:offline', {
    userId: socket.userId
  });

  // Update last seen
  try {
    await User.findByIdAndUpdate(socket.userId, {
      'metadata.lastActivity': new Date()
    });
  } catch (error) {
    logger.error('Error updating last activity:', error);
  }
};