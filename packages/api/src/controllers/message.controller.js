const Message = require('../models/message.model');
const Chat = require('../models/chat.model');
const Project = require('../models/project.model');
const claudeService = require('../services/claude.service');
const grokService = require('../services/grok.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

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

    // Verify chat ownership
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user._id
    }).populate('projectId');

    if (!chat) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'CHAT_NOT_FOUND',
        message: 'Chat not found'
      }));
    }

    // Check usage limit
    if (!req.user.canSendMessage()) {
      return res.status(429).json(apiResponse(false, null, {
        code: 'USAGE_LIMIT_EXCEEDED',
        message: 'Daily message limit exceeded'
      }));
    }

    // Create user message
    const userMessage = new Message({
      chatId,
      userId: req.user._id,
      role: 'user',
      content,
      attachments
    });
    await userMessage.save();

    // Get conversation history
    const history = await Message.find({
      chatId,
      isDeleted: false
    }).sort({ createdAt: 1 }).limit(20);

    // Prepare context
    let systemPrompt = '';
    const contextFiles = [];

    if (chat.projectId) {
      const project = await Project.findById(chat.projectId);
      if (project && project.settings.autoContext) {
        // Add project files to context
        contextFiles.push(...project.files);
        systemPrompt = `You have access to the following project files:\n${
          project.files.map(f => `- ${f.name}`).join('\n')
        }\n\n`;
      }
    }

    // Select AI service based on chat type
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
          systemPrompt,
          maxTokens: 4096,
          temperature: 0.7
        }
      );
    } else if (chat.type === 'grok') {
      aiResponse = await grokService.createMessage(
        history.map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments
        })),
        {
          model: chat.model,
          systemPrompt,
          maxTokens: 4096,
          temperature: 0.7
        }
      );
    } else {
      return res.status(400).json(apiResponse(false, null, {
        code: 'INVALID_CHAT_TYPE',
        message: 'Invalid chat type for sending messages'
      }));
    }

    // Create assistant message
    const assistantMessage = new Message({
      chatId,
      userId: req.user._id,
      role: 'assistant',
      content: aiResponse.content,
      model: chat.model,
      artifacts: aiResponse.artifacts,
      usage: aiResponse.usage
    });

    // Calculate cost
    const cost = chat.type === 'claude'
      ? claudeService.calculateCost(aiResponse.usage, chat.model)
      : grokService.calculateCost(aiResponse.usage, chat.model);
    
    assistantMessage.usage.cost = cost;
    await assistantMessage.save();

    // Update user usage
    req.user.usage.dailyMessages += 1;
    req.user.usage.totalMessages += 1;
    req.user.usage.totalTokens += aiResponse.usage.totalTokens;
    req.user.metadata.lastActivity = new Date();
    await req.user.save();

    // Update chat metadata
    chat.updateMetadata(aiResponse.usage.totalTokens);
    
    // Auto-generate title if it's still "New Chat"
    if (chat.title === 'New Chat' || chat.title.startsWith('New')) {
      // Use first user message to generate title
      const firstUserMessage = history.find(m => m.role === 'user');
      if (firstUserMessage) {
        chat.title = firstUserMessage.content.substring(0, 50) + 
                    (firstUserMessage.content.length > 50 ? '...' : '');
      }
    }
    
    await chat.save();

    res.json(apiResponse(true, {
      userMessage,
      assistantMessage,
      usage: req.user.usage
    }));
  } catch (error) {
    next(error);
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