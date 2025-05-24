const Chat = require('../models/chat.model');
const BrainstormSession = require('../models/brainstorm.model');
const claudeService = require('../services/claude.service');
const grokService = require('../services/grok.service');
const { apiResponse } = require('../utils/apiResponse');
const { validationResult } = require('express-validator');

// Start brainstorm session
exports.startBrainstorm = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(apiResponse(false, null, {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: errors.array()
      }));
    }

    const {
      topic,
      description,
      claudeModel = 'claude-4-opus',
      grokModel = 'grok-3',
      settings = {}
    } = req.body;

    // Create chat
    const chat = new Chat({
      userId: req.user._id,
      type: 'brainstorm',
      model: `${claudeModel} + ${grokModel}`,
      title: topic
    });
    await chat.save();

    // Create brainstorm session
    const session = new BrainstormSession({
      chatId: chat._id,
      userId: req.user._id,
      topic,
      description,
      participants: {
        claude: {
          model: claudeModel,
          systemPrompt: this.generateSystemPrompt('claude', settings.format)
        },
        grok: {
          model: grokModel,
          systemPrompt: this.generateSystemPrompt('grok', settings.format)
        }
      },
      settings: {
        ...session.settings,
        ...settings
      }
    });

    await session.save();

    // Send initial user message
    const initialMessage = `Topic: ${topic}\n${description ? `Description: ${description}` : ''}`;
    session.addMessage('user', initialMessage);
    await session.save();

    res.status(201).json(apiResponse(true, {
      chat,
      session
    }));
  } catch (error) {
    next(error);
  }
};

// Get brainstorm session
exports.getBrainstormSession = async (req, res, next) => {
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

    res.json(apiResponse(true, { session }));
  } catch (error) {
    next(error);
  }
};

// Send message to brainstorm
exports.sendBrainstormMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

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

    // Add user message
    const userMessage = session.addMessage('user', content);
    await session.save();

    // Continue the brainstorm
    const nextMessages = await this.continueBrainstorm(session);

    res.json(apiResponse(true, {
      userMessage,
      nextMessages,
      session
    }));
  } catch (error) {
    next(error);
  }
};

// Continue brainstorm conversation
exports.continueBrainstorm = async function(session) {
  const messages = [];
  
  // Get next speaker
  let speaker = session.getNextSpeaker();
  
  // Continue until both AI have responded
  for (let i = 0; i < 2; i++) {
    if (session.currentTurn >= session.settings.maxTurns) {
      session.complete();
      await session.save();
      break;
    }

    // Prepare conversation history
    const history = session.messages.map(m => ({
      role: m.speaker === 'user' ? 'user' : 'assistant',
      content: `[${m.speaker.toUpperCase()}]: ${m.content}`
    }));

    try {
      let response;
      
      if (speaker === 'claude') {
        response = await claudeService.createMessage(history, {
          model: session.participants.claude.model,
          systemPrompt: session.participants.claude.systemPrompt,
          maxTokens: 2048,
          temperature: 0.8
        });
      } else {
        response = await grokService.createMessage(history, {
          model: session.participants.grok.model,
          systemPrompt: session.participants.grok.systemPrompt,
          maxTokens: 2048,
          temperature: 0.8
        });
      }

      // Add AI message
      const aiMessage = session.addMessage(
        speaker,
        response.content,
        response.usage.totalTokens
      );
      
      messages.push(aiMessage);
      
      // Switch speaker
      speaker = speaker === 'claude' ? 'grok' : 'claude';
      
    } catch (error) {
      session.status = 'error';
      await session.save();
      throw error;
    }
  }

  await session.save();
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
    const nextMessages = await this.continueBrainstorm(session);

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
    session.summary = await this.generateSummary(session);
    session.insights = await this.extractInsights(session);
    
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
      session.summary = await this.generateSummary(session);
      session.insights = await this.extractInsights(session);
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