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
const { processProjectFiles, createProjectContext } = require('../utils/fileProcessor');

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

    // Debug: логируем attachments в сообщениях
    const attachmentDebug = messages.map(msg => ({
      messageId: msg._id,
      role: msg.role,
      hasAttachments: !!(msg.attachments && msg.attachments.length > 0),
      attachmentCount: msg.attachments?.length || 0,
      attachmentNames: msg.attachments?.map(att => att.name) || []
    })).filter(debug => debug.hasAttachments);
    
    if (attachmentDebug.length > 0) {
      console.log('📎 Messages with attachments being returned:', attachmentDebug);
    }

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
    const { content, attachments, projectFiles, projectId } = req.body;

    // Debug: проверяем req.user
    console.log('req.user:', req.user ? { id: req.user._id, email: req.user.email } : 'undefined');
    
    // Debug: проверяем attachments и project files
    console.log('📎 Attachments received:', {
      count: attachments ? attachments.length : 0,
      attachments: attachments ? attachments.map(att => ({
        name: att.name,
        type: att.type || att.mimeType,
        size: att.size,
        hasData: !!att.data
      })) : []
    });

    console.log('📁 Project files received:', {
      projectId,
      count: projectFiles ? projectFiles.length : 0,
      files: projectFiles ? projectFiles.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
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

    // Combine regular attachments with project files
    const allAttachments = [...(attachments || [])];
    
    // Add project files as attachments if provided
    if (projectFiles && projectFiles.length > 0) {
      const projectFileAttachments = projectFiles.map(file => ({
        ...file,
        isProjectFile: true,
        projectId: projectId
      }));
      allAttachments.push(...projectFileAttachments);
    }

    // Create user message
    const userMessage = new Message({
      chatId,
      content,
      role: 'user',
      userId: req.user._id,
      attachments: allAttachments,
      projectId: projectId || null
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

    // Get project context if the latest message has project files
    let projectContext = '';
    const latestMessage = history[history.length - 1];
    if (latestMessage && latestMessage.projectId) {
      try {
        const project = await Project.findById(latestMessage.projectId);
        if (project && project.files && project.files.length > 0) {
          console.log('📁 Processing project files for context:', {
            projectId: project._id,
            projectName: project.name,
            filesCount: project.files.length
          });

          // Обрабатываем файлы проекта
          const processedFiles = await processProjectFiles(project.files);
          projectContext = createProjectContext(processedFiles, project.name);
          
          console.log('✅ Project context created:', {
            contextLength: projectContext.length,
            processedFilesCount: processedFiles.length
          });
        }
      } catch (error) {
        console.error('❌ Error processing project context:', error);
      }
    }
    
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
    const messages = history.map((msg, index) => {
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
      
      // Добавляем проектный контекст к последнему пользовательскому сообщению
      let content = msg.content;
      if (index === history.length - 1 && msg.role === 'user' && projectContext) {
        content = msg.content + projectContext;
      }
      
      return {
        role: msg.role,
        content: content,
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
      
      // Мапинг старых моделей на новые
      let actualModel = chat.model;
      if (chat.type === 'claude') {
        const claudeModelMapping = {
          'claude-3-5-sonnet-20241022': 'claude-4-sonnet',
          'claude-3-5-sonnet': 'claude-4-sonnet',
          'claude-3.5-sonnet': 'claude-4-sonnet'
        };
        actualModel = claudeModelMapping[chat.model] || chat.model;
      }
      
      // Generate AI response
      if (chat.type === 'claude') {
        console.log('🤖 Generating Claude response...');
        
        console.log('🤖 Using Claude model:', { originalModel: chat.model, actualModel });
        
        // Системный промпт с инструкциями по артефактам
        const systemPrompt = `Ты полезный ассистент Claude.

Когда пользователь просит создать что-то практическое (код, логотип, диаграмму), создавай это в формате <artifact>.

Формат артефактов:
<artifact identifier="unique_id" type="тип" title="Описание">
СОДЕРЖИМОЕ
</artifact>

Типы артефактов:
- image/svg+xml для SVG логотипов и иконок
- application/vnd.ant.code для кода (добавь language="язык")
- application/vnd.ant.react для React компонентов
- text/html для HTML страниц

Пример SVG логотипа:
<artifact identifier="logo_example" type="image/svg+xml" title="Пример логотипа">
<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="80" fill="#4A90E2" rx="10"/>
  <text x="100" y="45" text-anchor="middle" fill="white" font-size="18" font-weight="bold">LOGO</text>
</svg>
</artifact>

Отвечай естественно и создавай артефакты для практических задач.`;

        aiResponse = await claudeService.createMessage(
          messages,
          {
            model: actualModel,
            maxTokens: 4096,
            temperature: 0.7,
            systemPrompt: systemPrompt
          }
        );
      } else {
        console.log('🤖 Generating Grok response...');
        
        // Мапинг новых Grok моделей 2025 года на реальные API модели
        const grokModelMapping = {
          'grok-3': 'grok-2-1212',               // Самая новая модель
          'grok-2-image': 'aurora',              // Image генерация через Aurora
          'grok-2-vision': 'grok-2-vision-1212', // Vision модель
        };
        
        const actualGrokModel = grokModelMapping[chat.model] || chat.model;
        console.log('🔄 Grok model mapping:', { original: chat.model, actual: actualGrokModel });
        
        aiResponse = await grokService.createMessage(
          messages,
          {
            model: actualGrokModel,
            maxTokens: 4096,
            temperature: 0.7
          }
        );
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
          actualModel: actualModel,
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
      // Системный промпт с инструкциями по артефактам
      const systemPrompt = `Ты полезный ассистент Claude.

Когда пользователь просит создать что-то практическое (код, логотип, диаграмму), создавай это в формате <artifact>.

Формат артефактов:
<artifact identifier="unique_id" type="тип" title="Описание">
СОДЕРЖИМОЕ
</artifact>

Типы артефактов:
- image/svg+xml для SVG логотипов и иконок
- application/vnd.ant.code для кода (добавь language="язык")
- application/vnd.ant.react для React компонентов
- text/html для HTML страниц

Пример SVG логотипа:
<artifact identifier="logo_example" type="image/svg+xml" title="Пример логотипа">
<svg viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="80" fill="#4A90E2" rx="10"/>
  <text x="100" y="45" text-anchor="middle" fill="white" font-size="18" font-weight="bold">LOGO</text>
</svg>
</artifact>

Отвечай естественно и создавай артефакты для практических задач.`;

      aiResponse = await claudeService.createMessage(
        history.map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments
        })),
        {
          model: chat.model,
          maxTokens: 4096,
          temperature: 0.8, // Slightly higher for variation
          systemPrompt: systemPrompt
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