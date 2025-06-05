const Chat = require('../models/chat.model');
const BrainstormSession = require('../models/brainstorm.model');
const claudeService = require('../services/claude.service');
const grokService = require('../services/grok.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Helper function to generate system prompts (moved to top to avoid circular dependency)
function generateSystemPrompt(ai, format = 'brainstorm') {
  const prompts = {
    brainstorm: {
      claude: `You are Claude, participating in a LIVE brainstorming session with Grok. Read and respond to previous messages in the conversation. Build upon ideas, challenge perspectives, and engage directly with what Grok has said. Reference specific points from the discussion. Be creative and collaborative.`,
      grok: `You are Grok, participating in a LIVE brainstorming session with Claude. Read and respond to previous messages in the conversation. Be bold, challenge Claude's ideas directly, and offer contrasting viewpoints. Reference what Claude has said and push back when you disagree. Be provocative and engaging.`
    },
    debate: {
      claude: `You are Claude in a LIVE DEBATE with Grok. Read the conversation history carefully and respond to Grok's specific arguments. Address their points directly, present counter-evidence, and challenge their reasoning respectfully but firmly. This is an interactive debate - engage with what has been said.`,
      grok: `You are Grok in a LIVE DEBATE with Claude. Read what Claude has said and respond aggressively to their arguments. Point out flaws in their reasoning, challenge their assumptions, and present stronger counter-arguments. Be sharp, witty, and don't hold back. This is a real debate - fight for your position.`
    },
    analysis: {
      claude: `You are Claude conducting analysis. Be systematic, thorough, and objective. Break down complex topics and provide clear insights.`,
      grok: `You are Grok conducting analysis. Be incisive, direct, and willing to point out uncomfortable truths. Cut through complexity with clarity.`
    },
    creative: {
      claude: `You are Claude in a creative session. Be imaginative, explore possibilities, and build elaborate concepts. Think artistically and expansively.`,
      grok: `You are Grok in a creative session. Be wildly inventive, break rules, and propose radical ideas. Push creative boundaries.`
    }
  };

  return prompts[format]?.[ai] || prompts.brainstorm[ai];
}

// Start brainstorm session
exports.startBrainstorm = async (req, res, next) => {
  try {
    console.log('Starting brainstorm session:', {
      userId: req.user?._id,
      body: req.body
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { topic, description, participants, settings } = req.body;

    // Получаем пользователя с настройками
    const User = require('../models/user.model');
    const user = await User.findById(req.user._id);
    
    // Создаем персонализированные промпты
    const claudePrompt = user?.settings?.brainstormPrompts?.claude || 
      generateSystemPrompt('claude', settings?.format || 'brainstorm');
    
    const grokPrompt = user?.settings?.brainstormPrompts?.grok || 
      generateSystemPrompt('grok', settings?.format || 'brainstorm');

    // Create chat first
    const chat = new Chat({
      userId: req.user._id,
      type: 'brainstorm',
      title: topic,
      model: 'brainstorm',
      firstMessage: description || topic
    });
    await chat.save();

    console.log('Chat created:', chat._id);

    // Create brainstorm session
    const session = new BrainstormSession({
      chatId: chat._id,
      userId: req.user._id,
      topic,
      description,
      participants: {
        claude: {
          model: participants?.claude?.model || 'claude-4-sonnet',
          systemPrompt: claudePrompt
        },
        grok: {
          model: participants?.grok?.model || 'grok-3',
          systemPrompt: grokPrompt
        }
      },
      settings: {
        ...settings,
        format: settings?.format || 'brainstorm'
      }
    });

    await session.save();

    console.log('💾 Brainstorm session saved:', {
      sessionId: session._id,
      userId: session.userId,
      chatId: session.chatId,
      topic: session.topic
    });

    console.log('✅ Brainstorm session created - waiting for user to start conversation...');

    res.status(201).json(apiResponse(true, {
      sessionId: session._id,
      chat,
      session
    }));
  } catch (error) {
    console.error('Brainstorm start error:', error);
    next(error);
  }
};

// Get brainstorm session
exports.getBrainstormSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting brainstorm session:', id);

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      console.log('❌ Session not found for user:', req.user._id);
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    console.log('✅ Session found:', {
      id: session._id,
      topic: session.topic,
      status: session.status,
      currentTurn: session.currentTurn,
      maxTurns: session.settings?.maxTurns,
      messagesCount: session.messages?.length || 0
    });

    const responseData = { session };
    console.log('📤 Sending response structure:', {
      success: true,
      data: {
        session: {
          _id: session._id,
          topic: session.topic,
          status: session.status,
          currentTurn: session.currentTurn,
          settings: session.settings,
          messagesCount: session.messages?.length || 0,
          messages: session.messages?.map((m, i) => ({
            index: i,
            id: m._id || m.id,
            speaker: m.speaker,
            content: m.content?.substring(0, 30) + '...',
            timestamp: m.timestamp
          }))
        }
      }
    });

    res.json(apiResponse(true, responseData));
  } catch (error) {
    console.error('❌ Error in getBrainstormSession:', error);
    next(error);
  }
};

// Get user's brainstorm sessions
exports.getBrainstormSessions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Getting brainstorm sessions for user:', req.user._id);

    // Build filter
    const filter = { userId: req.user._id };
    if (status) {
      filter.status = status;
    }

    // Get sessions with pagination
    const sessions = await BrainstormSession.find(filter)
      .select('topic description status currentTurn settings.maxTurns createdAt updatedAt totalTokens messages')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('📊 Found sessions:', sessions.length);

    // Get total count
    const total = await BrainstormSession.countDocuments(filter);

    // Format sessions for response
    const formattedSessions = sessions.map(session => {
      try {
        return {
          _id: session._id,
          topic: session.topic,
          description: session.description,
          status: session.status,
          currentTurn: session.currentTurn || 0,
          maxTurns: session.settings?.maxTurns || 10,
          totalTokens: session.totalTokens || 0,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          duration: session.duration
        };
      } catch (error) {
        console.error('❌ Error formatting session:', session._id, error.message);
        // Return basic session info if virtual fields fail
        return {
          _id: session._id,
          topic: session.topic || 'Unknown Topic',
          description: session.description,
          status: session.status || 'error',
          currentTurn: 0,
          maxTurns: session.settings?.maxTurns || 10,
          totalTokens: session.totalTokens || 0,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          duration: session.duration
        };
      }
    });

    res.json(apiResponse(true, {
      sessions: formattedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));
  } catch (error) {
    console.error('❌ Error in getBrainstormSessions:', error);
    next(error);
  }
};

// Continue AI discussion without user input
exports.continueAIDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    if (session.status === 'completed') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'SESSION_COMPLETED',
        message: 'Session is already completed'
      }));
    }

    console.log('🤖💬 Starting AI-only discussion round for session:', session._id);

    // Start AI conversation without user message
    const nextMessages = await exports.continueBrainstorm(session, req.io, req.user._id);
    
    console.log('✅ AI discussion round completed, messages:', nextMessages.length);

    res.json(apiResponse(true, {
      session,
      messagesAdded: nextMessages.length,
      message: 'AI discussion continued'
    }));
  } catch (error) {
    console.error('❌ Error in continueAIDiscussion:', error);
    next(error);
  }
};

// Delete brainstorm session
exports.deleteBrainstormSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    // Delete associated chat if exists
    if (session.chatId) {
      await Chat.findByIdAndDelete(session.chatId);
    }

    // Delete session
    await BrainstormSession.findByIdAndDelete(id);

    res.json(apiResponse(true, {
      message: 'Brainstorm session deleted successfully'
    }));
  } catch (error) {
    console.error('❌ Error in deleteBrainstormSession:', error);
    next(error);
  }
};

// Send message to brainstorm
exports.sendBrainstormMessage = async (req, res, next) => {
  try {
    console.log('📨 Brainstorm message received:', {
      sessionId: req.params.id,
      userId: req.user?._id,
      body: req.body,
      contentType: typeof req.body.content,
      contentValue: req.body.content,
      attachments: req.body.attachments?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    // Детальное логирование каждого attachment
    if (req.body.attachments && Array.isArray(req.body.attachments)) {
      req.body.attachments.forEach((attachment, index) => {
        console.log(`🔍 Attachment ${index}:`, {
          hasName: !!attachment?.name,
          hasData: !!attachment?.data,
          hasMimeType: !!attachment?.mimeType,
          keys: Object.keys(attachment || {}),
          fullObject: attachment
        });
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors in sendBrainstormMessage:', errors.array());
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const { id } = req.params;
    const { content, attachments = [] } = req.body;

    // Проверяем что есть контент или файлы
    const hasContent = content && content.trim().length > 0;
    const hasAttachments = attachments && Array.isArray(attachments) && attachments.length > 0;
    
    if (!hasContent && !hasAttachments) {
      console.log('❌ No content or attachments provided');
      return res.status(400).json(apiResponse(false, null, {
        code: 'EMPTY_MESSAGE',
        message: 'Content or attachments must be provided'
      }));
    }

    // Дополнительная валидация структуры attachments
    if (hasAttachments) {
      for (const attachment of attachments) {
        if (!attachment.name || !attachment.data || !attachment.mimeType) {
          console.log('❌ Invalid attachment structure:', attachment);
          return res.status(400).json(apiResponse(false, null, {
            code: 'INVALID_ATTACHMENT',
            message: 'Each attachment must have name, data, and mimeType'
          }));
        }
      }
    }

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    if (session.status !== 'active') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'SESSION_NOT_ACTIVE',
        message: 'Brainstorm session is not active'
      }));
    }

    // Add user message with attachments
    console.log('🔍 Before addMessage:', {
      content: content,
      contentType: typeof content,
      attachments: attachments,
      attachmentsLength: attachments.length,
      attachmentsStructure: attachments.map(a => ({
        name: a?.name,
        type: a?.type,
        mimeType: a?.mimeType,
        hasData: !!a?.data
      }))
    });
    
    const userMessage = session.addMessage('user', content || '', attachments);
    
    console.log('🔍 After addMessage, before save:', {
      messageId: userMessage.id,
      messageContent: userMessage.content,
      messageAttachments: userMessage.attachments?.length || 0
    });
    
    await session.save();
    console.log('💾 User message saved to session with', attachments.length, 'attachments');

    // Отправляем быстрый ответ и запускаем streaming в фоне
    res.json(apiResponse(true, {
      userMessage,
      session
    }));

    // Перезагружаем сессию из БД чтобы получить актуальное состояние
    const freshSession = await BrainstormSession.findById(session._id);
    
    // Continue the brainstorm with streaming (не ждем завершения)
    console.log('🚀 Starting AI conversation with streaming...');
    console.log('📡 IO object available:', !!req.io);
    console.log('👤 User ID:', req.user._id);
    
    exports.continueBrainstorm(freshSession, req.io, req.user._id).catch(error => {
      console.error('❌ Error in background brainstorm:', error);
    });

  } catch (error) {
    console.error('❌ Error in sendBrainstormMessage:', error);
    next(error);
  }
};

// Continue brainstorm conversation with PARALLEL streaming
exports.continueBrainstorm = async function(session, io, userId) {
  console.log('🔄 Starting PARALLEL continueBrainstorm for session:', session._id);
  
  // Подсчитываем количество пар сообщений (Claude + Grok = 1 ход)
  const aiMessages = session.messages.filter(m => m.speaker !== 'user').length;
  const actualTurns = Math.floor(aiMessages / 2);
  
  console.log('📊 Current turn status:', {
    aiMessages,
    actualTurns,
    maxTurns: session.settings.maxTurns,
    messagesTotal: session.messages.length
  });
  
  if (actualTurns >= session.settings.maxTurns) {
    console.log('⏹️ Max turns reached, completing session');
    session.complete();
    await session.save();
    return [];
  }

  // ПОСЛЕДОВАТЕЛЬНЫЙ ПАЙПЛАЙН: ИИ отвечают поочередно для живой дискуссии
  try {
    const messages = [];
    
    // Определяем порядок ответов (можно рандомизировать или по очереди)
    const speakers = session.messages.filter(m => m.speaker !== 'user').length % 2 === 0 
      ? ['claude', 'grok'] 
      : ['grok', 'claude'];
    
    console.log(`🚀 Запускаем ${speakers[0]} и ${speakers[1]} ПОСЛЕДОВАТЕЛЬНО для живой дискуссии...`);
    
    // Первый ИИ отвечает
    console.log(`🤖 ${speakers[0]} отвечает первым...`);
    const firstResult = await exports.generateBrainstormResponse(session, speakers[0], io, userId);
    if (firstResult) {
      messages.push(firstResult);
      // Обновляем сессию чтобы второй ИИ видел первый ответ
      await session.save();
      
      // Небольшая пауза для реалистичности
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Перезагружаем сессию с обновленными сообщениями
    const freshSession = await BrainstormSession.findById(session._id);
    
    // Второй ИИ отвечает, видя ответ первого
    console.log(`🤖 ${speakers[1]} отвечает, видя ответ ${speakers[0]}...`);
    const secondResult = await exports.generateBrainstormResponse(freshSession, speakers[1], io, userId);
    if (secondResult) {
      messages.push(secondResult);
    }
    
    console.log('✅ Получены ответы от обеих моделей последовательно:', {
      first: speakers[0],
      firstResult: !!firstResult,
      second: speakers[1], 
      secondResult: !!secondResult,
      totalMessages: messages.length
    });
    
    return messages;
  } catch (error) {
    console.error('❌ Error in parallel brainstorm:', error);
    session.status = 'error';
    await session.save();
    
    if (io) {
      io.to(`brainstorm:${session._id}`).emit('brainstorm:error', {
        sessionId: session._id,
        error: error.message
      });
    }
    
    return [];
  }
};

// Новая функция для генерации ответа одной модели
exports.generateBrainstormResponse = async function(session, speaker, io, userId) {
  console.log(`🤖 Starting ${speaker} response generation...`);

  // Prepare conversation history with better context formatting
  const history = session.messages.map(m => {
    if (m.speaker === 'user') {
      return {
        role: 'user',
        content: m.content,
        attachments: m.attachments || []
      };
    } else {
      // ДЛЯ ИИ СООБЩЕНИЙ НЕ ДОБАВЛЯЕМ ПРЕФИКСЫ - контент уже содержит нужную информацию
      return {
        role: 'assistant',
        content: m.content, // Убираем дублирование префиксов
        attachments: m.attachments || []
      };
    }
  });
  
  console.log(`📝 Prepared history for ${speaker}:`, history.length, 'messages');

  try {
    console.log(`🤖 Calling ${speaker} service with streaming...`);
    
    // Получаем персональные промпты пользователя
    const User = require('../models/user.model');
    const user = await User.findById(userId);
    const userPrompt = user?.settings?.brainstormPrompts?.[speaker];
    
    // Создаем временное сообщение для отображения процесса
    const tempMessageId = new mongoose.Types.ObjectId().toString();
    
    // Отправляем начало генерации
    if (io) {
      io.to(`brainstorm:${session._id}`).emit('brainstorm:streamStart', {
        sessionId: session._id,
        speaker: speaker,
        messageId: tempMessageId
      });
    }
    
    let fullContent = '';
    
    if (speaker === 'claude') {
      const stream = await claudeService.createStreamingMessage(history, {
        model: session.participants.claude.model,
        systemPrompt: userPrompt || session.participants.claude.systemPrompt,
        maxTokens: 2048,
        temperature: 0.8
      });
      
      // Обрабатываем поток
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          fullContent += chunk.delta.text;
          
          // Отправляем частичный контент через WebSocket
          if (io) {
            io.to(`brainstorm:${session._id}`).emit('brainstorm:streamChunk', {
              sessionId: session._id,
              speaker: speaker,
              messageId: tempMessageId,
              content: chunk.delta.text
            });
          }
        }
      }
    } else {
      // Grok пока не поддерживает streaming, используем обычный вызов
      const response = await grokService.createMessage(history, {
        model: session.participants.grok.model,
        systemPrompt: userPrompt || session.participants.grok.systemPrompt,
        maxTokens: 2048,
        temperature: 0.8
      });
      
      fullContent = response.content;
      
      // Эмулируем streaming для единообразия UX
      const words = fullContent.split(' ');
      const chunkSize = 5; // Отправляем по 5 слов
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(' ') + ' ';
        
        if (io) {
          io.to(`brainstorm:${session._id}`).emit('brainstorm:streamChunk', {
            sessionId: session._id,
            speaker: speaker,
            messageId: tempMessageId,
            content: chunk
          });
        }
        
        // Небольшая задержка для эмуляции печати
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`✅ ${speaker} response completed:`, {
      contentLength: fullContent.length
    });

    // Проверяем что ответ не пустой перед добавлением
    if (!fullContent || fullContent.trim().length === 0) {
      console.log(`⚠️  ${speaker} returned empty content, skipping message save`);
      return null; // Возвращаем null вместо сообщения
    }

    // Добавляем сообщение в сессию
    const aiMessage = session.addMessage(
      speaker,
      fullContent,
      [], // attachments
      0 // tokens будут подсчитаны позже
    );
    
    // Сохраняем сессию сразу после добавления сообщения
    await session.save();
    console.log(`💾 Added ${speaker} message to session and saved to DB`);
    
    // Отправляем завершение генерации
    if (io) {
      const room = `brainstorm:${session._id}`;
      console.log(`📡 Emitting streamComplete to room: ${room}`);
      
      // Проверяем, есть ли клиенты в комнате
      const sockets = await io.in(room).fetchSockets();
      console.log(`👥 Clients in room ${room}: ${sockets.length}`);
      
      io.to(room).emit('brainstorm:streamComplete', {
        sessionId: session._id,
        speaker: speaker,
        messageId: tempMessageId,
        message: aiMessage
      });
      
      console.log(`✅ Emitted streamComplete for ${speaker} to ${sockets.length} clients`);
    } else {
      console.log('⚠️  No io instance available for WebSocket emit');
    }
    
    // ВОЗВРАЩАЕМ СООБЩЕНИЕ для Promise.all
    return aiMessage;
    
  } catch (error) {
    console.error(`❌ Error in ${speaker} service:`, error.message);
    
    if (io) {
      io.to(`brainstorm:${session._id}`).emit('brainstorm:error', {
        sessionId: session._id,
        speaker: speaker,
        error: error.message
      });
    }
    
    throw error;
  }
};

// Pause brainstorm
exports.pauseBrainstorm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    if (session.status !== 'active') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'SESSION_NOT_ACTIVE',
        message: 'Session is not active'
      }));
    }

    session.status = 'paused';
    await session.save();

    res.json(apiResponse(true, {
      session,
      message: 'Brainstorm session paused'
    }));
  } catch (error) {
    next(error);
  }
};

// Resume brainstorm
exports.resumeBrainstorm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    if (session.status !== 'paused') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'SESSION_NOT_PAUSED',
        message: 'Session is not paused'
      }));
    }

    session.status = 'active';
    await session.save();

    // Continue the conversation
    const nextMessages = await exports.continueBrainstorm(session);

    res.json(apiResponse(true, {
      session,
      nextMessages,
      message: 'Brainstorm session resumed'
    }));
  } catch (error) {
    next(error);
  }
};

// Stop brainstorm
exports.stopBrainstorm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    if (session.status === 'completed') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'SESSION_ALREADY_COMPLETED',
        message: 'Session is already completed'
      }));
    }

    session.complete();
    
    // Generate summary
    session.summary = await exports.generateSummary(session);
    session.insights = await exports.extractInsights(session);
    
    await session.save();

    res.json(apiResponse(true, {
      session,
      message: 'Brainstorm session completed'
    }));
  } catch (error) {
    next(error);
  }
};

// Get summary
exports.getSummary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    if (session.status !== 'completed') {
      return res.status(400).json(apiResponse(false, null, {
        code: 'SESSION_NOT_COMPLETED',
        message: 'Session is not completed yet'
      }));
    }

    if (!session.summary) {
      session.summary = await exports.generateSummary(session);
      session.insights = await exports.extractInsights(session);
      await session.save();
    }

    res.json(apiResponse(true, {
      summary: session.summary,
      insights: session.insights,
      stats: {
        duration: session.duration,
        totalMessages: session.messages.length,
        totalTokens: session.totalTokens,
        claudeMessages: session.messages.filter(m => m.speaker === 'claude').length,
        grokMessages: session.messages.filter(m => m.speaker === 'grok').length
      }
    }));
  } catch (error) {
    next(error);
  }
};

// Export brainstorm
exports.exportBrainstorm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const session = await BrainstormSession.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!session) {
      return res.status(404).json(apiResponse(false, null, {
        code: 'SESSION_NOT_FOUND',
        message: 'Brainstorm session not found'
      }));
    }

    const exportData = session.toExportJSON();

    if (format === 'markdown') {
      const markdown = exports.convertToMarkdown(exportData);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="brainstorm-${id}.md"`);
      res.send(markdown);
    } else {
      res.json(apiResponse(true, { data: exportData }));
    }
  } catch (error) {
    next(error);
  }
};



// Helper: Generate summary
exports.generateSummary = async function(session) {
  const conversation = session.messages.map(m => 
    `${m.speaker.toUpperCase()}: ${m.content}`
  ).join('\n\n');

  try {
    const response = await claudeService.createMessage([{
      role: 'user',
      content: `Summarize this brainstorming session between Claude and Grok on the topic "${session.topic}":\n\n${conversation}\n\nProvide a concise summary of key points, agreements, disagreements, and conclusions.`
    }], {
      model: 'claude-4-sonnet',
      maxTokens: 500,
      temperature: 0.3
    });

    return response.content;
  } catch (error) {
    return session.generateSummary();
  }
};

// Helper: Extract insights
exports.extractInsights = async function(session) {
  const conversation = session.messages
    .filter(m => m.speaker !== 'user')
    .map(m => m.content)
    .join('\n\n');

  try {
    const response = await claudeService.createMessage([{
      role: 'user',
      content: `Extract 3-5 key insights from this brainstorming discussion:\n\n${conversation}\n\nList each insight as a brief, actionable statement.`
    }], {
      model: 'claude-4-sonnet',
      maxTokens: 300,
      temperature: 0.3
    });

    // Parse insights from response
    const insights = response.content
      .split('\n')
      .filter(line => line.trim())
      .filter(line => /^[\d\-\*•]/.test(line))
      .map(line => line.replace(/^[\d\-\*•]\s*/, '').trim());

    return insights;
  } catch (error) {
    return ['Key insights extraction failed'];
  }
};

// Helper: Convert to markdown
exports.convertToMarkdown = function(exportData) {
  let markdown = `# Brainstorm Session: ${exportData.topic}\n\n`;
  
  if (exportData.description) {
    markdown += `**Description:** ${exportData.description}\n\n`;
  }

  markdown += `**Date:** ${new Date(exportData.createdAt).toLocaleDateString()}\n`;
  markdown += `**Duration:** ${Math.floor(exportData.duration / 60)} minutes\n`;
  markdown += `**Total Messages:** ${exportData.messages.length}\n\n`;

  markdown += `## Conversation\n\n`;
  
  exportData.messages.forEach(msg => {
    markdown += `### ${msg.speaker}\n${msg.content}\n\n`;
  });

  if (exportData.summary) {
    markdown += `## Summary\n\n${exportData.summary}\n\n`;
  }

  if (exportData.insights && exportData.insights.length > 0) {
    markdown += `## Key Insights\n\n`;
    exportData.insights.forEach((insight, i) => {
      markdown += `${i + 1}. ${insight}\n`;
    });
  }

  return markdown;
};