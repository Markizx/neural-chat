const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.models = {
      'claude-4-opus': 'claude-opus-4-20250514',
      'claude-4-sonnet': 'claude-sonnet-4-20250514',
      'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022'
    };
  }

  async createMessage(messages, options = {}) {
    try {
      const {
        model = 'claude-3.5-sonnet',
        maxTokens = 4096,
        temperature = 0.7,
        systemPrompt = null,
        stream = false
      } = options;

      const modelId = this.models[model] || model;

      const params = {
        model: modelId,
        messages: this.formatMessages(messages),
        max_tokens: maxTokens,
        temperature,
        stream
      };

      if (systemPrompt) {
        params.system = systemPrompt;
      }

      if (stream) {
        return await this.client.messages.create(params);
      }

      const response = await this.client.messages.create(params);
      
      return {
        content: response.content[0].text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        model: modelId,
        artifacts: this.extractArtifacts(response.content[0].text)
      };
    } catch (error) {
      logger.error('Claude API error:', error);
      
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (error.status === 401) {
        throw new Error('Invalid API key');
      }
      
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  async createStreamingMessage(messages, options = {}) {
    try {
      const stream = await this.createMessage(messages, { ...options, stream: true });
      return stream;
    } catch (error) {
      logger.error('Claude streaming error:', error);
      throw error;
    }
  }

  formatMessages(messages) {
    return messages.map(msg => {
      const formatted = {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: []
      };

      // Add text content
      if (msg.content) {
        formatted.content.push({
          type: 'text',
          text: msg.content
        });
      }

      // Add attachments
      if (msg.attachments && msg.attachments.length > 0) {
        for (const attachment of msg.attachments) {
          if (attachment.type === 'image') {
            formatted.content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: attachment.mimeType,
                data: attachment.data || attachment.url // Assume base64 or URL
              }
            });
          }
        }
      }

      return formatted;
    });
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

    // Extract React components
    const reactRegex = /<function_calls>[\s\S]*?<invoke name="artifacts"[\s\S]*?type="application\/vnd\.ant\.react"[\s\S]*?<parameter name="content">([\s\S]*?)<\/antml:parameter>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g;
    
    while ((match = reactRegex.exec(content)) !== null) {
      artifacts.push({
        type: 'react',
        content: match[1].trim()
      });
    }

    return artifacts;
  }

  calculateCost(usage, model) {
    const pricing = {
      'claude-4-opus': { input: 0.015, output: 0.075 },
      'claude-4-sonnet': { input: 0.003, output: 0.015 },
      'claude-3.5-sonnet': { input: 0.003, output: 0.015 }
    };

    const modelPricing = pricing[model] || pricing['claude-3.5-sonnet'];
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  async validateApiKey(apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      
      // Try a minimal request
      await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new ClaudeService();