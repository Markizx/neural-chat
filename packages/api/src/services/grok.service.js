const axios = require('axios');
const logger = require('../utils/logger');

class GrokService {
  constructor() {
    this.apiKey = process.env.GROK_API_KEY;
    this.baseURL = 'https://api.x.ai/v1';
    
    // Создаем axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 секунд
    });
    
    // Актуальные модели Grok
    this.models = {
      'grok-3': 'grok-3',
      'grok-3-mini': 'grok-3-mini',
      'grok-3-fast': 'grok-3-fast',
      'grok-3-mini-fast': 'grok-3-mini-fast',
      'grok-2': 'grok-2-1212',
      'grok-2-vision': 'grok-2-vision-1212',
      'grok-2-image': 'grok-2-image-1212', // Модель для генерации изображений
      // Алиасы для обратной совместимости
      'grok-2-1212': 'grok-2-1212',
      'grok-2-vision-1212': 'grok-2-vision-1212',
      'grok-2-image-1212': 'grok-2-image-1212'
    };

    // Ценообразование для расчета стоимости
    this.pricing = {
      'grok-3': { input: 0.003, output: 0.015 }, // $3/$15 per 1M tokens
      'grok-3-mini': { input: 0.0003, output: 0.0005 }, // $0.30/$0.50 per 1M tokens
      'grok-3-fast': { input: 0.005, output: 0.025 }, // $5/$25 per 1M tokens
      'grok-3-mini-fast': { input: 0.0006, output: 0.004 }, // $0.60/$4 per 1M tokens
      'grok-2-1212': { input: 0.002, output: 0.01 }, // $2/$10 per 1M tokens
      'grok-2-vision-1212': { input: 0.002, output: 0.01 }, // $2/$10 per 1M tokens
      'grok-2-image-1212': { input: 0.002, output: 0.01 } // $2/$10 per 1M tokens
    };

    // Лимиты для каждой модели
    this.rateLimits = {
      'grok-3': 10,
      'grok-3-mini': 10,
      'grok-3-fast': 10,
      'grok-3-mini-fast': 10,
      'grok-2-1212': 15,
      'grok-2-vision-1212': 10,
      'grok-2-image-1212': 10
    };

    // Поддержка изображений
    this.visionModels = ['grok-2-vision-1212', 'grok-2-vision'];
    
    // Поддержка генерации изображений
    this.imageGenerationModels = ['grok-2-image-1212', 'grok-2-image'];
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

      let modelId = this.models[model] || model;
      
      // Автоматически переключаем на vision модель если есть изображения и текущая модель не поддерживает их
      const hasImages = messages.some(msg => 
        msg.attachments && msg.attachments.some(att => 
          att.mimeType && att.mimeType.startsWith('image/')
        )
      );
      
      if (hasImages && !this.supportsVision(modelId)) {
        console.log('🔄 Автоматически переключаем с', modelId, 'на grok-2-vision-1212 для обработки изображений');
        modelId = 'grok-2-vision-1212';
      }
      
      // Автоматически переключаем на image модель если пользователь просит сгенерировать изображение
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage && modelId !== 'grok-2-image-1212') {
        const imageGenerationKeywords = [
          'сгенериру', 'создай', 'нарисуй', 'изобрази', 'покажи',
          'generate', 'create', 'draw', 'show', 'make', 'design',
          'картин', 'изображен', 'иллюстрац', 'рисун', 'граф',
          'image', 'picture', 'illustration', 'graphic', 'visual',
          'фото', 'photo', 'арт', 'art'
        ];
        
        const requestsImageGeneration = imageGenerationKeywords.some(keyword => 
          lastUserMessage.content.toLowerCase().includes(keyword) && 
          (lastUserMessage.content.toLowerCase().includes('изображ') ||
           lastUserMessage.content.toLowerCase().includes('картин') ||
           lastUserMessage.content.toLowerCase().includes('image') ||
           lastUserMessage.content.toLowerCase().includes('picture') ||
           lastUserMessage.content.toLowerCase().includes('фото') ||
           lastUserMessage.content.toLowerCase().includes('рисун'))
        );
        
        if (requestsImageGeneration) {
          console.log('🎨 Автоматически переключаем с', modelId, 'на grok-2-image-1212 для генерации изображений');
          modelId = 'grok-2-image-1212';
        }
      }

      // Проверяем контекстное окно
      const contextSize = this.getContextSize(modelId);
      
      const requestBody = {
        model: modelId,
        messages: this.formatMessages(messages, systemPrompt, modelId),
        max_tokens: Math.min(maxTokens, contextSize),
        temperature,
        stream
      };

      if (stream) {
        // Для streaming используем другой подход
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
      
      if (error.response) {
        // Обработка ошибок от API
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 429) {
          const modelId = this.models[options.model] || options.model;
          throw new Error(`Rate limit exceeded for model ${modelId}. Limit: ${this.rateLimits[modelId]}rps`);
        }
        
        if (status === 401) {
          throw new Error('Invalid API key');
        }
        
        if (status === 400) {
          throw new Error(`Bad request: ${errorData.error?.message || 'Invalid request'}`);
        }
        
        throw new Error(`Grok API error: ${errorData.error?.message || error.message}`);
      } else if (error.request) {
        // Ошибка сети
        throw new Error('Network error: Unable to reach Grok API');
      } else {
        // Другие ошибки
        throw error;
      }
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

  formatMessages(messages, systemPrompt, modelId) {
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
        content: []
      };

      // Add text content
      if (msg.content) {
        formatted.content.push({
          type: 'text',
          text: msg.content
        });
      }

      // Handle attachments for vision models
      if (msg.attachments && msg.attachments.length > 0 && this.supportsVision(modelId)) {
        console.log('🔍 Grok processing attachments (vision):', {
          count: msg.attachments.length,
          modelId,
          attachments: msg.attachments.map(att => ({
            name: att.name,
            type: att.type || att.mimeType,
            size: att.size,
            hasData: !!att.data
          }))
        });
        
        msg.attachments.forEach(attachment => {
          const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');
          
          if (isImage && attachment.data) {
            // Поддерживаем как data URL, так и чистый base64
            const imageUrl = attachment.data.startsWith('data:') 
              ? attachment.data 
              : `data:${attachment.mimeType};base64,${attachment.data}`;
              
            formatted.content.push({
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'auto'
              }
            });
          }
        });
      } else if (msg.attachments && msg.attachments.length > 0) {
        // For non-vision models, add attachment info as text
        console.log('🔍 Grok processing attachments (non-vision):', {
          count: msg.attachments.length,
          modelId,
          attachments: msg.attachments.map(att => ({
            name: att.name,
            type: att.type || att.mimeType,
            size: att.size,
            hasData: !!att.data
          }))
        });
        
        const attachmentTexts = msg.attachments.map(att => {
          if (att.mimeType && att.mimeType.startsWith('image/')) {
            return `[Изображение: ${att.name} (${att.mimeType}, ${att.size ? Math.round(att.size / 1024) + ' KB' : 'размер неизвестен'})]`;
          } else if (att.mimeType && att.mimeType.startsWith('text/')) {
            let content = att.content || '';
            
            // Если есть data (base64), пытаемся декодировать
            if (!content && att.data) {
              try {
                if (att.data.includes(',')) {
                  const base64Data = att.data.split(',')[1];
                  content = Buffer.from(base64Data, 'base64').toString('utf-8');
                } else {
                  content = Buffer.from(att.data, 'base64').toString('utf-8');
                }
              } catch (e) {
                console.error('Failed to decode text file:', e);
                content = '[Не удалось декодировать содержимое файла]';
              }
            }
            
            return `📄 Файл: ${att.name}\n\`\`\`\n${content || '[Файл пуст]'}\n\`\`\``;
          } else if (att.mimeType && (att.mimeType.includes('json') || att.mimeType.includes('xml') || 
                     att.mimeType.includes('yaml') || att.mimeType.includes('markdown'))) {
            let content = '';
            
            if (att.data) {
              try {
                const base64Data = att.data.includes(',') 
                  ? att.data.split(',')[1] 
                  : att.data;
                content = Buffer.from(base64Data, 'base64').toString('utf-8');
              } catch (e) {
                console.error('Failed to decode file:', e);
              }
            }
            
            return `📄 Файл: ${att.name} (${att.mimeType})\n\`\`\`\n${content || '[Не удалось прочитать файл]'}\n\`\`\``;
          } else {
            return `📎 Файл: ${att.name} (${att.mimeType || 'неизвестный тип'}, ${att.size ? Math.round(att.size / 1024) + ' KB' : 'размер неизвестен'})`;
          }
        });
        
        if (attachmentTexts.length > 0) {
          formatted.content[0].text += '\n\n' + attachmentTexts.join('\n');
        }
      }

      // If content array has only one text item, simplify to string
      if (formatted.content.length === 1 && formatted.content[0].type === 'text') {
        formatted.content = formatted.content[0].text;
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
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'code',
        language: match[1] || 'plain',
        content: match[2].trim()
      });
    }
    
    // Extract generated images (например: [Generated Image: description])
    const imageRegex = /\[Generated Image: ([^\]]+)\]/g;
    while ((match = imageRegex.exec(content)) !== null) {
      artifacts.push({
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'generated-image',
        description: match[1].trim(),
        // URL изображения должен быть предоставлен API
      });
    }
    
    // Extract image URLs в markdown формате
    const imageUrlRegex = /!\[([^\]]*)\]\(([^\)]+)\)/g;
    while ((match = imageUrlRegex.exec(content)) !== null) {
      artifacts.push({
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'image',
        alt: match[1].trim(),
        url: match[2].trim()
      });
    }

    return artifacts;
  }

  calculateCost(usage, model) {
    const modelId = this.models[model] || model;
    const pricing = this.pricing[modelId] || this.pricing['grok-3'];
    
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  getContextSize(model) {
    const modelId = this.models[model] || model;
    
    // grok-2-vision has smaller context
    if (modelId === 'grok-2-vision-1212') {
      return 32768; // 32K tokens
    }
    
    // All other models support 131K tokens
    return 131072;
  }

  supportsVision(model) {
    const modelId = this.models[model] || model;
    return this.visionModels.includes(modelId);
  }

  supportsImageGeneration(model) {
    const modelId = this.models[model] || model;
    return this.imageGenerationModels.includes(modelId);
  }

  getRateLimit(model) {
    const modelId = this.models[model] || model;
    return this.rateLimits[modelId] || 10; // Default to 10 rps
  }

  async validateApiKey(apiKey) {
    try {
      const testClient = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      await testClient.post('/chat/completions', {
        model: 'grok-3-mini', // Используем самую дешевую модель для проверки
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      });
      
      return true;
    } catch (error) {
      logger.error('API key validation failed:', error);
      return false;
    }
  }

  // Получить список доступных моделей
  getAvailableModels() {
    return [
      {
        id: 'grok-3',
        name: 'Grok 3',
        description: 'Most capable model for complex tasks',
        contextSize: 131072,
        supportsVision: false,
        pricing: { input: '$3.00/1M', output: '$15.00/1M' },
        rateLimit: '10 rps'
      },
      {
        id: 'grok-3-mini',
        name: 'Grok 3 Mini',
        description: 'Efficient model for everyday tasks',
        contextSize: 131072,
        supportsVision: false,
        pricing: { input: '$0.30/1M', output: '$0.50/1M' },
        rateLimit: '10 rps'
      },
      {
        id: 'grok-3-fast',
        name: 'Grok 3 Fast',
        description: 'Fast responses for complex tasks',
        contextSize: 131072,
        supportsVision: false,
        pricing: { input: '$5.00/1M', output: '$25.00/1M' },
        rateLimit: '10 rps'
      },
      {
        id: 'grok-3-mini-fast',
        name: 'Grok 3 Mini Fast',
        description: 'Fast and efficient for quick tasks',
        contextSize: 131072,
        supportsVision: false,
        pricing: { input: '$0.60/1M', output: '$4.00/1M' },
        rateLimit: '10 rps'
      },
      {
        id: 'grok-2',
        name: 'Grok 2',
        description: 'Previous generation model',
        contextSize: 131072,
        supportsVision: false,
        pricing: { input: '$2.00/1M', output: '$10.00/1M' },
        rateLimit: '15 rps'
      },
      {
        id: 'grok-2-vision',
        name: 'Grok 2 Vision',
        description: 'Multimodal model with image understanding',
        contextSize: 32768,
        supportsVision: true,
        pricing: { input: '$2.00/1M', output: '$10.00/1M', image: '$2.00/1M' },
        rateLimit: '10 rps'
      },
      {
        id: 'grok-2-image',
        name: 'Grok 2 Image',
        description: 'Model for image generation',
        contextSize: 131072,
        supportsImageGeneration: true,
        pricing: { input: '$2.00/1M', output: '$10.00/1M' },
        rateLimit: '10 rps'
      }
    ];
  }

  // Оценка стоимости до отправки запроса
  estimateCost(messages, model = 'grok-3') {
    const modelId = this.models[model] || model;
    const pricing = this.pricing[modelId] || this.pricing['grok-3'];
    
    // Грубая оценка токенов
    let estimatedInputTokens = 0;
    
    messages.forEach(msg => {
      // Примерно 4 символа на токен
      if (typeof msg.content === 'string') {
        estimatedInputTokens += Math.ceil(msg.content.length / 4);
      } else if (Array.isArray(msg.content)) {
        msg.content.forEach(item => {
          if (item.type === 'text') {
            estimatedInputTokens += Math.ceil(item.text.length / 4);
          } else if (item.type === 'image_url' && this.supportsVision(modelId)) {
            // Изображения обычно занимают около 765 токенов
            estimatedInputTokens += 765;
          }
        });
      }
    });
    
    // Предполагаем, что ответ будет примерно такой же длины
    const estimatedOutputTokens = Math.min(estimatedInputTokens, 2048);
    
    const estimatedInputCost = (estimatedInputTokens / 1000) * pricing.input;
    const estimatedOutputCost = (estimatedOutputTokens / 1000) * pricing.output;
    
    return {
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedTotalTokens: estimatedInputTokens + estimatedOutputTokens,
      estimatedCost: estimatedInputCost + estimatedOutputCost,
      breakdown: {
        input: estimatedInputCost,
        output: estimatedOutputCost
      }
    };
  }

  // Метод для обработки streaming ответов
  async *streamResponse(stream) {
    try {
      for await (const chunk of stream) {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            
            if (data === '[DONE]') {
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (e) {
              logger.error('Error parsing stream chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Stream processing error:', error);
      throw error;
    }
  }
}

module.exports = new GrokService();