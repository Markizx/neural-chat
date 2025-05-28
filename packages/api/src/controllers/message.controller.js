const Message = require('../models/message.model');
const Chat = require('../models/chat.model');
const Project = require('../models/project.model');
const claudeService = require('../services/claude.service');
const grokService = require('../services/grok.service');
const brainstormService = require('../services/brainstorm.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Helper functions
async function checkUsageLimits(userId) {
  // Simple usage check - can be enhanced with subscription logic
  return true; // For now, allow all users
}

async function updateUsageTracking(userId, usage) {
  // Update user usage statistics
  // This can be enhanced to track daily/monthly limits
  return true;
}

// Get messages for a chat
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify chat ownership
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user._id
    });

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: 1 }
    };

    const messages = await Message.find({
      chatId,
      isDeleted: false
    })
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Message.countDocuments({
      chatId,
      isDeleted: false
    });

    res.json(apiResponse(true, {
      messages,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        hasNext: options.page * options.limit < total
      }
    }));
  } catch (error) {
    next(error);
  }
};

// Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content, attachments } = req.body;

    // Debug: проверяем req.user
    console.log('req.user:', req.user ? { id: req.user._id, email: req.user.email } : 'undefined');

    // Validate required fields
    if (!chatId || !content) {
      return res.status(400).json({ 
        error: 'Chat ID and content are required' 
      });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ 
        error: 'User not authenticated' 
      });
    }

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check usage limits
    const canSend = await checkUsageLimits(req.user._id);
    if (!canSend) {
      return res.status(429).json({ 
        error: 'Usage limit exceeded. Please upgrade your plan.' 
      });
    }

    // Create user message
    const userMessage = new Message({
      chatId,
      content,
      role: 'user',
      userId: req.user._id,
      attachments: attachments || []
    });

    await userMessage.save();

    // Update chat's last activity
    chat.lastActivity = new Date();
    await chat.save();

    // Get chat history for context
    const history = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(50);
    
    // Prepare messages for AI
    const messages = history.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    let aiResponse;
    
    try {
      switch (chat.type) {
        case 'claude':
          aiResponse = await claudeService.createMessage(messages, {
            model: chat.model || 'claude-3.5-sonnet',
            maxTokens: 4000
          });
          break;
          
        case 'grok':
          aiResponse = await grokService.createMessage(messages, {
            model: chat.model || 'grok-3',
            maxTokens: 4000
          });
          break;
          
        case 'brainstorm':
          aiResponse = await brainstormService.generateIdeas(content, {
            context: messages.slice(-5) // Last 5 messages for context
          });
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid chat type' });
      }

      if (!aiResponse || !aiResponse.content) {
        throw new Error('Empty response from AI service');
      }

      // Create assistant message
      const assistantMessage = new Message({
        chatId,
        content: aiResponse.content,
        role: 'assistant',
        userId: req.user._id,
        metadata: {
          model: chat.model,
          tokens: aiResponse.usage || {},
          processingTime: aiResponse.processingTime
        }
      });

      // Дополнительная проверка перед сохранением
      if (!assistantMessage.userId) {
        console.error('Assistant message missing userId:', {
          chatId,
          userId: req.user._id,
          userExists: !!req.user
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to create assistant message - missing user ID'
        });
      }

      await assistantMessage.save();

      // Update usage tracking
      await updateUsageTracking(req.user._id, {
        tokensUsed: aiResponse.usage?.totalTokens || 0,
        requestType: chat.type
      });

      // Emit real-time update if WebSocket is available
      if (req.io) {
        req.io.to(`chat_${chatId}`).emit('new_message', {
          message: assistantMessage,
          chatId
        });
      }

      res.json({
        success: true,
        userMessage,
        assistantMessage,
        usage: aiResponse.usage
      });

    } catch (aiError) {
      console.error('AI service error:', aiError);
      
      // Return a user-friendly error message
      let errorMessage = 'Failed to get AI response';
      
      if (aiError.message) {
        if (aiError.message.includes('rate limit') || aiError.message.includes('quota')) {
          errorMessage = 'AI service rate limit exceeded. Please try again later.';
        } else if (aiError.message.includes('authentication') || aiError.message.includes('API key')) {
          errorMessage = 'AI service authentication failed. Please contact support.';
        } else if (aiError.message.includes('timeout')) {
          errorMessage = 'AI service timeout. Please try again.';
        } else {
          errorMessage = aiError.message;
        }
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    
    let errorMessage = 'Failed to send message';
    if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

// Get message by ID
exports.getMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!message) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found'
      }));
    }

    res.json(apiResponse(true, { message }));
  } catch (error) {
    next(error);
  }
};

// Update message
exports.updateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const message = await Message.findOne({
      _id: id,
      userId: req.user._id,
      role: 'user' // Only user messages can be edited
    });

    if (!message) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found or cannot be edited'
      }));
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    res.json(apiResponse(true, { message }));
  } catch (error) {
    next(error);
  }
};

// Delete message
exports.deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!message) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found'
      }));
    }

    // Soft delete
    message.softDelete();
    await message.save();

    res.json(apiResponse(true, { message: 'Message deleted successfully' }));
  } catch (error) {
    next(error);
  }
};

// Add feedback
exports.addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const message = await Message.findOne({
      _id: id,
      userId: req.user._id,
      role: 'assistant' // Only AI messages can have feedback
    });

    if (!message) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found or cannot have feedback'
      }));
    }

    message.addFeedback(rating, comment);
    await message.save();

    res.json(apiResponse(true, { 
      message: 'Feedback added successfully',
      feedback: message.feedback
    }));
  } catch (error) {
    next(error);
  }
};

// Regenerate message
exports.regenerateMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await Message.findOne({
      _id: id,
      userId: req.user._id,
      role: 'assistant'
    });

    if (!message) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'MESSAGE_NOT_FOUND',
        message: 'Message not found or cannot be regenerated'
      }));
    }

    // Get chat
    const chat = await Chat.findById(message.chatId);
    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    // Get conversation history up to this message
    const history = await Message.find({
      chatId: message.chatId,
      createdAt: { $lt: message.createdAt },
      isDeleted: false
    }).sort({ createdAt: 1 });

    // Regenerate with same AI service
    let aiResponse;
    if (chat.type === 'claude') {
      aiResponse = await claudeService.createMessage(
        history.map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments
        })),
        {
          model: chat.model,
          maxTokens: 4096,
          temperature: 0.8 // Slightly higher for variation
        }
      );
    } else {
      aiResponse = await grokService.createMessage(
        history.map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments
        })),
        {
          model: chat.model,
          maxTokens: 4096,
          temperature: 0.8
        }
      );
    }

    // Update message
    message.content = aiResponse.content;
    message.artifacts = aiResponse.artifacts;
    message.usage = aiResponse.usage;
    message.isEdited = true;
    message.editedAt = new Date();
    
    // Calculate new cost
    const cost = chat.type === 'claude'
      ? claudeService.calculateCost(aiResponse.usage, chat.model)
      : grokService.calculateCost(aiResponse.usage, chat.model);
    
    message.usage.cost = cost;
    await message.save();

    // Update usage
    req.user.usage.totalTokens += aiResponse.usage.totalTokens;
    await req.user.save();

    res.json(apiResponse(true, { message }));
  } catch (error) {
    next(error);
  }
};