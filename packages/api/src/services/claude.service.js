const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.models = {
      'claude-3.7-sonnet': 'claude-3-7-sonnet-20241022',
      'claude-4-sonnet': 'claude-sonnet-4-20250514',
      'claude-4-opus': 'claude-opus-4-20250514',
      'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-4-opus': 'claude-opus-4-20250514',
      'claude-4-sonnet': 'claude-sonnet-4-20250514'
    };
  }

  async createMessage(messages, options = {}) {
    try {
      const {
        model = 'claude-3.7-sonnet',
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
        console.log('🔍 Claude processing attachments:', {
          count: msg.attachments.length,
          attachments: msg.attachments.map(att => ({
            name: att.name,
            type: att.type || att.mimeType,
            size: att.size,
            hasData: !!att.data
          }))
        });
        
        for (const attachment of msg.attachments) {
          // Определяем тип файла по mimeType
          const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');
          
          if (isImage && attachment.data) {
            // Убираем префикс data:image/...;base64, если он есть
            const base64Data = attachment.data.includes(',') 
              ? attachment.data.split(',')[1] 
              : attachment.data;
              
            formatted.content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: attachment.mimeType,
                data: base64Data
              }
            });
          } else if (attachment.type === 'text' || attachment.mimeType?.startsWith('text/')) {
            // Для текстовых файлов добавляем содержимое как текст
            let content = attachment.content || '';
            
            // Если есть data (base64), пытаемся декодировать
            if (!content && attachment.data) {
              try {
                if (attachment.data.includes(',')) {
                  // data:text/plain;base64,xxxxx
                  const base64Data = attachment.data.split(',')[1];
                  content = Buffer.from(base64Data, 'base64').toString('utf-8');
                } else {
                  content = Buffer.from(attachment.data, 'base64').toString('utf-8');
                }
              } catch (e) {
                console.error('Failed to decode text file:', e);
                content = '[Не удалось декодировать содержимое файла]';
              }
            }
            
            formatted.content.push({
              type: 'text',
              text: `📄 Файл: ${attachment.name}\n\`\`\`\n${content || '[Файл пуст]'}\n\`\`\``
            });
          } else if (attachment.mimeType?.includes('json') || attachment.mimeType?.includes('xml') || 
                     attachment.mimeType?.includes('yaml') || attachment.mimeType?.includes('markdown')) {
            // Для структурированных текстовых файлов
            let content = '';
            
            if (attachment.data) {
              try {
                const base64Data = attachment.data.includes(',') 
                  ? attachment.data.split(',')[1] 
                  : attachment.data;
                content = Buffer.from(base64Data, 'base64').toString('utf-8');
              } catch (e) {
                console.error('Failed to decode file:', e);
              }
            }
            
            formatted.content.push({
              type: 'text',
              text: `📄 Файл: ${attachment.name} (${attachment.mimeType})\n\`\`\`\n${content || '[Не удалось прочитать файл]'}\n\`\`\``
            });
          } else {
            // Для других типов файлов добавляем информацию о файле
            formatted.content.push({
              type: 'text',
              text: `Прикреплен файл: ${attachment.name} (${attachment.mimeType || 'неизвестный тип'}, ${attachment.size ? Math.round(attachment.size / 1024) + ' KB' : 'размер неизвестен'})`
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
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'code',
        language: match[1] || 'plain',
        content: match[2].trim()
      });
    }

    // Extract React components from Claude artifacts
    const reactRegex = /<function_calls>[\s\S]*?<invoke name="artifacts"[\s\S]*?type="application\/vnd\.ant\.react"[\s\S]*?<parameter name="content">([\s\S]*?)<\/antml:parameter>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g;
    
    while ((match = reactRegex.exec(content)) !== null) {
      artifacts.push({
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'react',
        content: match[1].trim()
      });
    }
    
    // Extract SVG artifacts
    const svgRegex = /<function_calls>[\s\S]*?<invoke name="artifacts"[\s\S]*?type="image\/svg\+xml"[\s\S]*?<parameter name="content">([\s\S]*?)<\/antml:parameter>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g;
    
    while ((match = svgRegex.exec(content)) !== null) {
      artifacts.push({
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'svg',
        content: match[1].trim()
      });
    }
    
    // Extract HTML artifacts
    const htmlRegex = /<function_calls>[\s\S]*?<invoke name="artifacts"[\s\S]*?type="text\/html"[\s\S]*?<parameter name="content">([\s\S]*?)<\/antml:parameter>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g;
    
    while ((match = htmlRegex.exec(content)) !== null) {
      artifacts.push({
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'html',
        content: match[1].trim()
      });
    }

    return artifacts;
  }

  calculateCost(usage, model) {
    const pricing = {
      'claude-3.7-sonnet': { input: 0.003, output: 0.015 },
      'claude-4-sonnet': { input: 0.003, output: 0.015 },
      'claude-4-opus': { input: 0.015, output: 0.075 },
      // Для обратной совместимости
      'claude-3.5-sonnet': { input: 0.003, output: 0.015 }
    };

    const modelPricing = pricing[model] || pricing['claude-3.7-sonnet'];
    
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