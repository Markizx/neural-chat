const axios = require('axios');
const logger = require('../utils/logger');

class GrokService {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.baseURL = 'https://api.x.ai/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    this.models = {
      'grok-3': 'grok-3',
      'grok-2': 'grok-2'
    };
  }

  async createMessage(messages, options = {}) {
    try {
      const {
        model = 'grok-3',
        maxTokens = 4096,
        temperature = 0.7,
        systemPrompt = null,
        stream = false
      } = options;

      const modelId = this.models[model] || model;

      const requestBody = {
        model: modelId,
        messages: this.formatMessages(messages, systemPrompt),
        max_tokens: maxTokens,
        temperature,
        stream
      };

      if (stream) {
        const response = await this.client.post('/chat/completions', requestBody, {
          responseType: 'stream'
        });
        return response.data;
      }

      const response = await this.client.post('/chat/completions', requestBody);
      const data = response.data;

      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        },
        model: modelId,
        artifacts: this.extractArtifacts(data.choices[0].message.content)
      };
    } catch (error) {
      logger.error('Grok API error:', error);
      
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      
      throw new Error(`Grok API error: ${error.message}`);
    }
  }

  async createStreamingMessage(messages, options = {}) {
    try {
      const stream = await this.createMessage(messages, { ...options, stream: true });
      return stream;
    } catch (error) {
      logger.error('Grok streaming error:', error);
      throw error;
    }
  }

  formatMessages(messages, systemPrompt) {
    const formattedMessages = [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      formattedMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // Format user messages
    messages.forEach(msg => {
      const formatted = {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content || ''
      };

      // Grok doesn't support images in the same way as Claude
      // You might need to adjust this based on Grok's actual API
      if (msg.attachments && msg.attachments.length > 0) {
        const attachmentText = msg.attachments
          .map(att => `[Attachment: ${att.name}]`)
          .join('\n');
        formatted.content += '\n' + attachmentText;
      }

      formattedMessages.push(formatted);
    });

    return formattedMessages;
  }

  extractArtifacts(content) {
    const artifacts = [];
    
    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      artifacts.push({
        type: 'code',
        language: match[1] || 'plain',
        content: match[2].trim()
      });
    }

    return artifacts;
  }

  calculateCost(usage, model) {
    const pricing = {
      'grok-3': { input: 0.01, output: 0.03 },
      'grok-2': { input: 0.005, output: 0.015 }
    };

    const modelPricing = pricing[model] || pricing['grok-3'];
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  async validateApiKey(apiKey) {
    try {
      const client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Try a minimal request
      await client.post('/chat/completions', {
        model: 'grok-2',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new GrokService();