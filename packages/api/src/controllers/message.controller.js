const Message = require('../models/message.model');
const Chat = require('../models/chat.model');
const Project = require('../models/project.model');
const claudeService = require('../services/claude.service');
const grokService = require('../services/grok.service');
const brainstormService = require('../services/brainstorm.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const mongoose = require('mongoose');

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
    
    // Debug: проверяем attachments
    console.log('📎 Attachments received:', {
      count: attachments ? attachments.length : 0,
      attachments: attachments ? attachments.map(att => ({
        name: att.name,
        type: att.type || att.mimeType,
        size: att.size,
        hasData: !!att.data
      })) : []
    });

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

    // Отправляем пользовательское сообщение немедленно
    res.json({
      success: true,
      userMessage,
      message: 'Message sent, AI response is being generated'
    });

    // Генерируем ответ AI в фоне с streaming
    generateAIResponseWithStreaming(chatId, req.user._id, chat, req.io);

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

// Функция для генерации AI ответа с streaming
async function generateAIResponseWithStreaming(chatId, userId, chat, io) {
  console.log('🤖 Starting AI response generation:', { chatId, userId, chatType: chat.type });
  
  try {
    // Get chat history for context
    const history = await Message.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(50);
    
    console.log('📚 Chat history loaded:', { messageCount: history.length });
    
    // Debug: проверяем attachments в истории
    const attachmentDebug = history.map(msg => ({
      messageId: msg._id,
      hasAttachments: !!(msg.attachments && msg.attachments.length > 0),
      attachmentCount: msg.attachments?.length || 0,
      attachmentTypes: msg.attachments?.map(att => att.type) || [],
      attachmentDataPresent: msg.attachments?.map(att => !!att.data) || []
    })).filter(debug => debug.hasAttachments);
    
    if (attachmentDebug.length > 0) {
      console.log('📎 Attachments in history:', attachmentDebug);
    }
    
    // Prepare messages for AI
    const messages = history.map(msg => {
      const processedAttachments = (msg.attachments || []).map(att => {
        const hasData = !!(att.data);
        console.log(`📁 Processing attachment: ${att.name}, hasData: ${hasData}, type: ${att.type}`);
        return {
          name: att.name,
          type: att.type,
          mimeType: att.mimeType,
          size: att.size,
          data: att.data, // Сохраняем данные файла
          url: att.url
        };
      });
      
      return {
        role: msg.role,
        content: msg.content,
        attachments: processedAttachments
      };
    });

    // Получаем персональный системный промпт пользователя
    const user = await User.findById(userId);
    const userSystemPrompt = chat.type === 'claude' 
      ? user?.settings?.systemPrompts?.claude 
      : user?.settings?.systemPrompts?.grok;

    // Получаем кастомную роль ИИ из настроек пользователя
    const aiRole = chat.type === 'claude'
      ? user?.settings?.aiRoles?.claude || 'Assistant'
      : user?.settings?.aiRoles?.grok || 'Assistant';

    console.log('👤 User system prompt:', { 
      hasPrompt: !!userSystemPrompt, 
      promptLength: userSystemPrompt?.length || 0 
    });

    console.log('🎭 AI Role:', { role: aiRole, chatType: chat.type });

    // Создаем временный ID для сообщения
    const tempMessageId = new mongoose.Types.ObjectId().toString();

    // Отправляем начало streaming
    if (io) {
      console.log('🔄 Emitting streamStart event');
      io.to(`chat:${chatId}`).emit('message:streamStart', {
        chatId,
        messageId: tempMessageId,
        model: chat.model || chat.type
      });
    } else {
      console.log('❌ No io object available for streaming');
    }

    let fullContent = '';
    let aiResponse;

    try {
      console.log('🎯 Calling AI service:', { type: chat.type, model: chat.model });
      
      // Debug: логируем финальные сообщения перед отправкой в AI
      console.log('📨 Messages to be sent to AI:', {
        count: messages.length,
        hasAttachments: messages.some(m => m.attachments && m.attachments.length > 0),
        attachmentDetails: messages.flatMap(m => 
          (m.attachments || []).map(att => ({
            name: att.name,
            type: att.type,
            mimeType: att.mimeType,
            size: att.size,
            hasData: !!att.data,
            dataPreview: att.data ? att.data.substring(0, 50) + '...' : 'no data'
          }))
        )
      });
      
      switch (chat.type) {
        case 'claude':
          // Используем Claude streaming
          if (claudeService.createStreamingMessage) {
            console.log('📡 Using Claude streaming API');
            const stream = await claudeService.createStreamingMessage(messages, {
              model: chat.model || 'claude-3.5-sonnet',
              maxTokens: 4000,
              systemPrompt: userSystemPrompt || undefined,
              temperature: 0.7
            });

            // Обрабатываем поток
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                fullContent += chunk.delta.text;
                
                // Отправляем частичный контент через WebSocket
                if (io) {
                  io.to(`chat:${chatId}`).emit('message:streamChunk', {
                    chatId,
                    messageId: tempMessageId,
                    content: chunk.delta.text
                  });
                }
              }
            }

            aiResponse = {
              content: fullContent,
              usage: { totalTokens: Math.ceil(fullContent.length / 4) } // Примерная оценка
            };
          } else {
            console.log('📞 Using Claude regular API (fallback)');
            // Fallback к обычному API
            aiResponse = await claudeService.createMessage(messages, {
              model: chat.model || 'claude-3.5-sonnet',
              maxTokens: 4000,
              systemPrompt: userSystemPrompt || undefined
            });
            fullContent = aiResponse.content;

            // Эмулируем streaming для единообразия UX
            await simulateStreaming(fullContent, tempMessageId, chatId, io);
          }
          break;
          
        case 'grok':
          console.log('🚀 Using Grok API');
          // Grok пока не поддерживает streaming, используем обычный вызов
          aiResponse = await grokService.createMessage(messages, {
            model: chat.model || 'grok-3',
            maxTokens: 4000,
            systemPrompt: userSystemPrompt || undefined
          });
          fullContent = aiResponse.content;

          // Эмулируем streaming для единообразия UX
          await simulateStreaming(fullContent, tempMessageId, chatId, io);
          break;
          
        default:
          throw new Error('Invalid chat type');
      }

      console.log('✅ AI response received:', { 
        contentLength: aiResponse?.content?.length || 0,
        hasUsage: !!aiResponse?.usage 
      });

      if (!aiResponse || !aiResponse.content) {
        throw new Error('Empty response from AI service');
      }

      // Create assistant message
      const assistantMessage = new Message({
        chatId,
        content: aiResponse.content,
        role: 'assistant',
        userId: userId,
        model: aiRole,
        metadata: {
          originalModel: chat.model,
          customRole: aiRole,
          tokens: aiResponse.usage || {},
          processingTime: aiResponse.processingTime
        }
      });

      await assistantMessage.save();
      console.log('💾 Assistant message saved:', assistantMessage._id);

      // Update usage tracking
      await updateUsageTracking(userId, {
        tokensUsed: aiResponse.usage?.totalTokens || 0,
        requestType: chat.type
      });

      // Отправляем завершение streaming
      if (io) {
        console.log('🏁 Emitting streamComplete event');
        io.to(`chat:${chatId}`).emit('message:streamComplete', {
          chatId,
          messageId: tempMessageId,
          message: assistantMessage
        });
      }

    } catch (aiError) {
      console.error('❌ AI service error:', aiError);
      
      // Отправляем ошибку через WebSocket
      if (io) {
        io.to(`chat:${chatId}`).emit('message:streamError', {
          chatId,
          messageId: tempMessageId,
          error: aiError.message || 'AI service error'
        });
      }
    }

  } catch (error) {
    console.error('💥 Error in generateAIResponseWithStreaming:', error);
    
    if (io) {
      io.to(`chat:${chatId}`).emit('message:streamError', {
        chatId,
        error: error.message || 'Unknown error'
      });
    }
  }
}

// Функция для эмуляции streaming (для API без нативной поддержки)
async function simulateStreaming(content, messageId, chatId, io) {
  if (!io) return;

  const words = content.split(' ');
  const chunkSize = 3; // Отправляем по 3 слова за раз
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
    
    io.to(`chat:${chatId}`).emit('message:streamChunk', {
      chatId,
      messageId,
      content: chunk
    });
    
    // Небольшая задержка для эмуляции печати
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

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