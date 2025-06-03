const claudeService = require('./claude.service');
const grokService = require('./grok.service');
const logger = require('../utils/logger');

class BrainstormService {
  constructor() {
    this.defaultSettings = {
      maxTurns: 10,
      format: 'discussion',
      temperature: 0.8,
      maxTokens: 2048
    };
  }

  async generateIdeas(topic, options = {}) {
    try {
      const {
        context = [],
        format = 'discussion',
        maxTurns = 5
      } = options;

      // Create initial prompt for brainstorming
      const systemPrompt = this.generateSystemPrompt(format);
      
      // Prepare messages for AI
      const messages = [
        {
          role: 'user',
          content: `Let's brainstorm about: ${topic}\n\nPlease provide creative ideas and insights.`
        },
        ...context
      ];

      // Use Claude for initial brainstorming
      const claudeResponse = await claudeService.createMessage(messages, {
        model: 'claude-3-opus-20240229',
        systemPrompt,
        maxTokens: this.defaultSettings.maxTokens,
        temperature: this.defaultSettings.temperature
      });

      return {
        content: claudeResponse.content,
        usage: claudeResponse.usage,
        model: 'brainstorm',
        type: 'brainstorm'
      };

    } catch (error) {
      logger.error('Brainstorm service error:', error);
      throw new Error(`Brainstorm generation failed: ${error.message}`);
    }
  }

  async startSession(topic, description, participants = {}) {
    try {
      const {
            claudeModel = 'claude-4-sonnet',
    grokModel = 'grok-2-1212'
      } = participants;

      const session = {
        topic,
        description,
        participants: {
          claude: {
            model: claudeModel,
            systemPrompt: this.generateSystemPrompt('claude')
          },
          grok: {
            model: grokModel,
            systemPrompt: this.generateSystemPrompt('grok')
          }
        },
        messages: [],
        currentTurn: 0,
        status: 'active'
      };

      return session;
    } catch (error) {
      logger.error('Brainstorm session start error:', error);
      throw error;
    }
  }

  async continueSession(session, userMessage) {
    try {
      const messages = [];
      
      // Add user message
      session.messages.push({
        speaker: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      // Get responses from both AI
      const claudeResponse = await this.getAIResponse(session, 'claude');
      const grokResponse = await this.getAIResponse(session, 'grok');

      session.messages.push({
        speaker: 'claude',
        content: claudeResponse.content,
        tokens: claudeResponse.usage.totalTokens,
        timestamp: new Date()
      });

      session.messages.push({
        speaker: 'grok',
        content: grokResponse.content,
        tokens: grokResponse.usage.totalTokens,
        timestamp: new Date()
      });

      session.currentTurn++;

      return {
        claudeMessage: session.messages[session.messages.length - 2],
        grokMessage: session.messages[session.messages.length - 1],
        session
      };

    } catch (error) {
      logger.error('Brainstorm session continue error:', error);
      throw error;
    }
  }

  async getAIResponse(session, aiType) {
    const history = session.messages.map(m => ({
      role: m.speaker === 'user' ? 'user' : 'assistant',
      content: `[${m.speaker.toUpperCase()}]: ${m.content}`
    }));

    if (aiType === 'claude') {
      return await claudeService.createMessage(history, {
        model: session.participants.claude.model,
        systemPrompt: session.participants.claude.systemPrompt,
        maxTokens: this.defaultSettings.maxTokens,
        temperature: this.defaultSettings.temperature
      });
    } else {
      return await grokService.createMessage(history, {
        model: session.participants.grok.model,
        systemPrompt: session.participants.grok.systemPrompt,
        maxTokens: this.defaultSettings.maxTokens,
        temperature: this.defaultSettings.temperature
      });
    }
  }

  generateSystemPrompt(aiType, format = 'discussion') {
    const basePrompts = {
      claude: `You are Claude, participating in a creative brainstorming session. You are thoughtful, analytical, and provide well-structured ideas. Focus on practical solutions and detailed analysis.`,
      grok: `You are Grok, participating in a creative brainstorming session. You are witty, unconventional, and think outside the box. Bring humor and unexpected perspectives to the discussion.`,
      discussion: `You are an AI assistant helping with brainstorming. Provide creative, diverse ideas and build upon previous suggestions.`
    };

    const formatInstructions = {
      discussion: `Engage in a natural discussion format. Build on previous ideas and ask thought-provoking questions.`,
      structured: `Provide ideas in a structured format with clear categories and bullet points.`,
      creative: `Focus on highly creative and unconventional ideas. Think outside the box.`
    };

    const prompt = basePrompts[aiType] || basePrompts.discussion;
    const instruction = formatInstructions[format] || formatInstructions.discussion;

    return `${prompt}\n\n${instruction}\n\nKeep responses concise but insightful. Aim for 2-3 paragraphs maximum.`;
  }

  validateSession(session) {
    return session && 
           session.topic && 
           session.participants && 
           session.status === 'active';
  }
}

module.exports = new BrainstormService(); 