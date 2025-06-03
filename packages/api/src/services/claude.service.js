const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    
    this.models = {
      'claude-4-opus': 'claude-3-opus-20240229',            // Самая мощная модель
      'claude-4-sonnet': 'claude-3-opus-20240229',          // Основная модель (используем Opus)
      'claude-3.7-sonnet': 'claude-3-haiku-20240307',       // Стандартная модель (используем Haiku)
      'claude-3-haiku-20240307': 'claude-3-haiku-20240307', // Для совместимости
      'claude-3-opus-20240229': 'claude-3-opus-20240229'    // Для совместимости
    };
  }

  async createMessage(messages, options = {}) {
    try {
      const {
        model = 'claude-4-sonnet',
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
      
      const fullText = response.content[0].text;
      const artifacts = this.extractArtifacts(fullText);
      const cleanContent = this.removeArtifactsFromText(fullText, artifacts);
      
      return {
        content: cleanContent,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        },
        model: modelId,
        artifacts: artifacts
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
    
    // Правильный парсер артефактов Claude - ищем теги <artifact>
    const artifactRegex = /<artifact([^>]*?)>([\s\S]*?)<\/artifact>/g;
    let match;
    
    while ((match = artifactRegex.exec(content)) !== null) {
      const attributeString = match[1];
      const artifactContent = match[2];
      
      // Извлекаем атрибуты
      const attributes = this.extractArtifactAttributes(attributeString);
      
      if (attributes.identifier) {
        artifacts.push({
          id: attributes.identifier,
          type: this.mapArtifactType(attributes.type),
          title: attributes.title || '',
          language: attributes.language || this.detectLanguage(artifactContent, attributes.type),
          content: artifactContent.trim()
        });
      }
    }
    
    // Также извлекаем обычные code blocks как fallback
    if (artifacts.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      
      while ((match = codeBlockRegex.exec(content)) !== null) {
        artifacts.push({
          id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'code',
          language: match[1] || 'plain',
          content: match[2].trim(),
          title: `Code (${match[1] || 'plain'})`
        });
      }
    }

    return artifacts;
  }

  removeArtifactsFromText(content, artifacts) {
    let cleanContent = content;
    
    // Удаляем теги <artifact>...</artifact> из текста
    const artifactRegex = /<artifact([^>]*?)>([\s\S]*?)<\/artifact>/g;
    cleanContent = cleanContent.replace(artifactRegex, '');
    
    // Убираем лишние переносы строк
    cleanContent = cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
    
    return cleanContent;
  }

  extractArtifactAttributes(attributeString) {
    const attributes = {};
    
    const patterns = {
      identifier: /identifier\s*=\s*["']([^"']+)["']/,
      type: /type\s*=\s*["']([^"']+)["']/,
      title: /title\s*=\s*["']([^"']+)["']/,
      language: /language\s*=\s*["']([^"']+)["']/
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = attributeString.match(pattern);
      if (match) {
        attributes[key] = match[1];
      }
    }
    
    return attributes;
  }

  mapArtifactType(type) {
    const typeMapping = {
      'application/vnd.ant.code': 'code',
      'text/markdown': 'markdown',
      'application/vnd.ant.react': 'react',
      'image/svg+xml': 'svg',
      'text/html': 'html',
      'text/mermaid': 'mermaid'
    };
    
    return typeMapping[type] || 'code';
  }

  detectLanguage(content, type) {
    if (!content || typeof content !== 'string') return 'text';
    
    const contentLower = content.toLowerCase();
    
    // Определяем по типу артефакта
    if (type === 'application/vnd.ant.react') return 'jsx';
    if (type === 'image/svg+xml') return 'xml';
    if (type === 'text/html') return 'html';
    if (type === 'text/markdown') return 'markdown';
    
    // JavaScript/TypeScript
    if (contentLower.includes('import ') || 
        contentLower.includes('export ') || 
        contentLower.includes('function ') ||
        contentLower.includes('const ') ||
        contentLower.includes('let ') ||
        contentLower.includes('var ')) {
      if (contentLower.includes('interface ') || 
          contentLower.includes(': string') ||
          contentLower.includes(': number')) {
        return 'typescript';
      }
      return 'javascript';
    }
    
    // Python
    if (contentLower.includes('def ') || 
        contentLower.includes('import ') ||
        contentLower.includes('from ') ||
        contentLower.includes('class ') ||
        contentLower.includes('print(')) {
      return 'python';
    }
    
    // HTML
    if (contentLower.includes('<!doctype') || 
        contentLower.includes('<html') ||
        contentLower.includes('<div') ||
        contentLower.includes('<body')) {
      return 'html';
    }
    
    // CSS
    if (contentLower.includes('{') && contentLower.includes('}') && 
        (contentLower.includes('color:') || 
         contentLower.includes('margin:') || 
         contentLower.includes('padding:'))) {
      return 'css';
    }
    
    // JSON
    const trimmed = content.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(content);
        return 'json';
      } catch (e) {
        // Не JSON
      }
    }
    
    // SQL
    if (contentLower.includes('select ') ||
        contentLower.includes('create ') ||
        contentLower.includes('insert ') ||
        contentLower.includes('update ')) {
      return 'sql';
    }
    
    return 'text';
  }

  calculateCost(usage, model) {
    const pricing = {
      'claude-4-opus': { input: 0.015, output: 0.075 },         // Премиум модель (Claude 3 Opus)
      'claude-4-sonnet': { input: 0.015, output: 0.075 },       // Стандартная модель (Claude 3 Opus)
      'claude-3.7-sonnet': { input: 0.00025, output: 0.00125 }, // Базовая модель (Claude 3 Haiku)
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 }
    };

    const modelPricing = pricing[model] || pricing['claude-4-sonnet'];
    
    const inputCost = (usage.promptTokens / 1000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  }

  async validateApiKey(apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      
      // Try a minimal request
      await client.messages.create({
        model: 'claude-3-opus-20240229',
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