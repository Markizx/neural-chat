const Chat = require('../models/chat.model');
const BrainstormSession = require('../models/brainstorm.model');
const claudeService = require('../services/claude.service');
const grokService = require('../services/grok.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

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
      exports.generateSystemPrompt('claude', settings?.format || 'brainstorm');
    
    const grokPrompt = user?.settings?.brainstormPrompts?.grok || 
      exports.generateSystemPrompt('grok', settings?.format || 'brainstorm');

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

    // Send initial user message
    const initialMessage = `Topic: ${topic}\n${description ? `Description: ${description}` : ''}`;
    session.addMessage('user', initialMessage);
    await session.save();

    console.log('📝 Initial message added and session re-saved');

    console.log('Initial message added, starting AI conversation...');

    // Start the AI conversation
    try {
      const nextMessages = await exports.continueBrainstorm(session);
      console.log('AI conversation started, messages:', nextMessages.length);
    } catch (aiError) {
      console.error('AI conversation error:', aiError);
      // Don't fail the whole request if AI fails
    }

    res.status(201).json(apiResponse(true, {
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
          messagesCount: session.messages?.length || 0
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
    if (!content && (!attachments || attachments.length === 0)) {
      console.log('❌ No content or attachments provided');
      return res.status(400).json(apiResponse(false, null, {
        code: 'EMPTY_MESSAGE',
        message: 'Content or attachments must be provided'
      }));
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
    const userMessage = session.addMessage('user', content, attachments);
    await session.save();
    console.log('💾 User message saved to session with', attachments.length, 'attachments');

    // Отправляем быстрый ответ и запускаем streaming в фоне
    res.json(apiResponse(true, {
      userMessage,
      session
    }));

    // Continue the brainstorm with streaming (не ждем завершения)
    console.log('🚀 Starting AI conversation with streaming...');
    exports.continueBrainstorm(session, req.io, req.user._id).catch(error => {
      console.error('❌ Error in background brainstorm:', error);
    });

  } catch (error) {
    console.error('❌ Error in sendBrainstormMessage:', error);
    next(error);
  }
};

// Continue brainstorm conversation with streaming
exports.continueBrainstorm = async function(session, io, userId) {
  console.log('🔄 Starting continueBrainstorm for session:', session._id);
  
  const messages = [];
  
  // Get next speaker
  let speaker = session.getNextSpeaker();
  console.log('🎤 Next speaker:', speaker);
  
  // Continue with one speaker at a time for better UX
  if (session.currentTurn >= session.settings.maxTurns) {
    console.log('⏹️ Max turns reached, completing session');
    session.complete();
    await session.save();
    return messages;
  }

  // Prepare conversation history
  const history = session.messages.map(m => ({
    role: m.speaker === 'user' ? 'user' : 'assistant',
    content: `[${m.speaker.toUpperCase()}]: ${m.content}`,
    attachments: m.attachments || []
  }));
  
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
      io.to(`brainstorm_${session._id}`).emit('brainstorm:streamStart', {
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
            io.to(`brainstorm_${session._id}`).emit('brainstorm:streamChunk', {
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
          io.to(`brainstorm_${session._id}`).emit('brainstorm:streamChunk', {
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

    // Добавляем сообщение в сессию
    const aiMessage = session.addMessage(
      speaker,
      fullContent,
      [], // attachments
      0 // tokens будут подсчитаны позже
    );
    
    // Отправляем завершение генерации
    if (io) {
      io.to(`brainstorm_${session._id}`).emit('brainstorm:streamComplete', {
        sessionId: session._id,
        speaker: speaker,
        messageId: tempMessageId,
        message: aiMessage
      });
    }
    
    console.log(`💾 Added ${speaker} message to session`);
    messages.push(aiMessage);
    
    // Сохраняем сессию
    await session.save();
    
    // Автоматически продолжаем с другим AI через небольшую задержку
    setTimeout(async () => {
      const nextSpeaker = speaker === 'claude' ? 'grok' : 'claude';
      
      if (session.currentTurn < session.settings.maxTurns && session.status === 'active') {
        console.log(`🔄 Auto-continuing with ${nextSpeaker}`);
        await exports.continueBrainstorm(session, io, userId);
      }
    }, 1000); // 1 секунда задержки между ответами
    
  } catch (error) {
    console.error(`❌ Error in ${speaker} service:`, error.message);
    session.status = 'error';
    await session.save();
    
    if (io) {
      io.to(`brainstorm_${session._id}`).emit('brainstorm:error', {
        sessionId: session._id,
        error: error.message
      });
    }
    
    throw error;
  }

  console.log('✅ continueBrainstorm completed, returning', messages.length, 'messages');
  return messages;
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
      const markdown = this.convertToMarkdown(exportData);
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

// Helper: Generate system prompt
exports.generateSystemPrompt = function(ai, format = 'brainstorm') {
  const prompts = {
    brainstorm: {
      claude: `You are Claude, participating in a brainstorming session. Be creative, thoughtful, and build upon ideas presented. Offer unique perspectives and innovative solutions. Be concise but insightful.`,
      grok: `You are Grok, participating in a brainstorming session. Be bold, unconventional, and challenge assumptions. Bring fresh perspectives and think outside the box. Be direct and engaging.`
    },
    debate: {
      claude: `You are Claude in a debate. Present well-reasoned arguments, use evidence, and maintain a respectful tone. Challenge opposing views constructively.`,
      grok: `You are Grok in a debate. Take strong positions, use sharp wit, and don't be afraid to be controversial. Challenge conventional thinking.`
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
      model: 'claude-3.5-sonnet',
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
      model: 'claude-3.5-sonnet',
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