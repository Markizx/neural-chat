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
    
    // Актуальные модели Grok (стандартизированные)
    this.models = {
      'grok-2-1212': 'grok-2-1212',
      'grok-2-vision-1212': 'grok-2-vision-1212',
      'aurora': 'aurora' // Добавляем модель Aurora для генерации изображений
    };

    // Ценообразование для расчета стоимости (стандартизированные модели)
    this.pricing = {
      'grok-2-1212': { input: 0.002, output: 0.01 }, // $2/$10 per 1M tokens
      'grok-2-vision-1212': { input: 0.005, output: 0.015 }, // $5/$15 per 1M tokens
      'aurora': { input: 0.002, output: 0.01 } // Ценообразование для Aurora
    };

    // Лимиты для каждой модели (стандартизированные)
    this.rateLimits = {
      'grok-2-1212': 15,
      'grok-2-vision-1212': 10,
      'aurora': 10
    };

    // Поддержка изображений
    this.visionModels = ['grok-2-vision-1212', 'grok-2-vision'];
    
    // Поддержка генерации изображений
    this.imageGenerationModels = ['grok-2-image-1212', 'grok-2-image', 'aurora'];
  }

  async createMessage(messages, options = {}) {
    try {
      const {
        model = 'grok-2-1212',
        maxTokens = 4096,
        temperature = 0.7,
        systemPrompt = null,
        stream = false
      } = options;

      let modelId = this.models[model] || model;
      
      // Если это модель Aurora, используем специальную обработку для генерации изображений
      if (modelId === 'aurora') {
        const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
        if (!lastUserMessage) {
          throw new Error('No user message found for image generation');
        }
        return await this.generateImage(lastUserMessage.content);
      }
      
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
      if (lastUserMessage && !this.supportsImageGeneration(modelId)) {
        const imageGenerationKeywords = [
          'сгенериру', 'создай', 'нарисуй', 'изобрази', 'покажи',
          'generate', 'create', 'draw', 'show', 'make', 'design',
          'картин', 'изображен', 'иллюстрац', 'рисун', 'граф',
          'image', 'picture', 'illustration', 'graphic', 'visual',
          'фото', 'photo', 'арт', 'art'
        ];
        
        const requestsImageGeneration = imageGenerationKeywords.some(keyword => 
          lastUserMessage.content.toLowerCase().includes(keyword)
        ) || (lastUserMessage.content.toLowerCase().includes('изображ') ||
           lastUserMessage.content.toLowerCase().includes('картин') ||
           lastUserMessage.content.toLowerCase().includes('image') ||
           lastUserMessage.content.toLowerCase().includes('picture') ||
           lastUserMessage.content.toLowerCase().includes('фото') ||
           lastUserMessage.content.toLowerCase().includes('рисун'));
        
        if (requestsImageGeneration) {
          console.log('🎨 Автоматически переключаем с', modelId, 'на aurora для генерации изображений');
          modelId = 'aurora';
        }
      }

      // Если после автопереключения получили aurora, сразу генерируем изображение
      if (modelId === 'aurora') {
        const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
        if (!lastUserMessage) {
          throw new Error('No user message found for image generation');
        }
        return await this.generateImage(lastUserMessage.content);
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

  async generateImage(prompt) {
    try {
      logger.info(`🎨 Использование Grok для генерации изображения, prompt: ${prompt.substring(0, 50)}...`);
      
      // Делаем запрос к X.AI API для генерации изображения
      const requestBody = {
        prompt: prompt,
        model: 'grok-2-image',
        response_format: 'url',
        n: 1
      };

      const response = await axios.post('https://api.x.ai/v1/images/generations', requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 секунд для генерации изображения
      });
      
      if (!response.data?.data?.[0]?.url) {
        logger.error('Grok API response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Grok API не вернул URL изображения');
      }
      
      const imageUrl = response.data.data[0].url;
      logger.info(`🖼️ Получен URL изображения: ${imageUrl}`);
      
      // Логируем полученный промпт (если есть)
      if (response.data.data[0].revised_prompt) {
        logger.info(`Grok переработал промпт: ${response.data.data[0].revised_prompt.substring(0, 100)}`);
      }

      const artifactId = `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      logger.info(`🎨 Создаем artifact для изображения: ${artifactId}, URL: ${imageUrl}`);
      
      return { 
        content: `Конечно! Вот изображение: ${prompt}

![Generated Image](${imageUrl})

Изображение было успешно сгенерировано с помощью модели Grok 2 Image.`,
        imageUrl, 
        generator: 'grok-2-image', 
        quality: 'hd',
        revisedPrompt: response.data.data[0].revised_prompt,
        usage: {
          promptTokens: Math.ceil(prompt.length / 4),
          completionTokens: 50,
          totalTokens: Math.ceil(prompt.length / 4) + 50
        },
        model: 'aurora',
        artifacts: [
          {
            id: artifactId,
            type: 'generated-image',
            url: imageUrl,
            description: prompt,
            revisedPrompt: response.data.data[0].revised_prompt
          }
        ]
      };
    } catch (error) {
      logger.error('Grok image generation error:', error);
      
      // Если генерация изображений не поддерживается, возвращаем текстовый ответ
      if (error.response?.status === 400 || error.response?.data?.error?.code === 'unsupported_model') {
        logger.warn('Grok image generation не поддерживается, возвращаем текстовый ответ');
        return {
          content: `Извините, я не могу генерировать изображения в данный момент. Но я могу подробно описать, как бы выглядело изображение: "${prompt}"

Попробуйте использовать другую модель для генерации изображений.`,
          generator: 'grok-text-fallback',
          usage: {
            promptTokens: Math.ceil(prompt.length / 4),
            completionTokens: 100,
            totalTokens: Math.ceil(prompt.length / 4) + 100
          },
          model: 'aurora'
        };
      }
      
      throw error;
    }
  }

  extractImageDescription(userMessage) {
    // Извлекаем описание изображения из запроса пользователя
    const lowerMessage = userMessage.toLowerCase();
    
    // Ищем ключевые слова для извлечения контекста
    if (lowerMessage.includes('bmw') && lowerMessage.includes('e60') && lowerMessage.includes('m5')) {
      return 'BMW E60 M5 ярко-красного цвета';
    }
    
    // Убираем слова-команды и оставляем описание
    const cleanedMessage = userMessage
      .replace(/сгенериру[йж]?|создай|нарисуй|изобрази|покажи/gi, '')
      .replace(/generate|create|draw|show|make/gi, '')
      .replace(/изображение|картинку|фото|рисунок/gi, '')
      .replace(/image|picture|photo/gi, '')
      .trim();
    
    return cleanedMessage || 'запрошенное изображение';
  }

  async getChatResponse(messages) {
    try {
      logger.info('🤖 Отправка запроса в Grok AI для чата');
      
      // Проверяем и фильтруем сообщения
      const validMessages = messages.filter(msg => msg && msg.content && msg.content.trim().length > 0);
      
      if (validMessages.length === 0) {
        throw new Error('Нет сообщений для отправки');
      }
      
      // Добавляем системное сообщение если его нет
      const messagesWithSystem = validMessages[0]?.role === 'system' 
        ? validMessages 
        : [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Respond in the same language as the user\'s messages.'
            },
            ...validMessages
          ];
      
      const requestBody = {
        messages: messagesWithSystem,
        model: 'grok-3', // Используем самую мощную модель Grok-3
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      };

      const response = await axios.post('https://api.x.ai/v1/chat/completions', requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const aiResponse = response.data?.choices?.[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('Grok AI не вернул ответ');
      }
      
      return {
        content: aiResponse,
        usage: response.data.usage,
        model: 'grok-3'
      };
    } catch (error) {
      logger.error('Grok chat error:', error);
      
      // Обработка ошибок API
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 429) {
          throw new Error(`Rate limit exceeded for Grok chat`);
        }
        
        if (status === 401) {
          throw new Error('Invalid Grok API key');
        }
        
        if (status === 400) {
          throw new Error(`Bad request: ${errorData.error?.message || 'Invalid request'}`);
        }
        
        throw new Error(`Grok API error: ${errorData.error?.message || error.message}`);
      }
      
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
    const pricing = this.pricing[modelId] || this.pricing['grok-2-1212'];
    
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
        name: 'Grok 2 Image (Aurora)',
        description: 'Model for image generation powered by Aurora',
        contextSize: 131072,
        supportsImageGeneration: true,
        pricing: { input: '$2.00/1M', output: '$10.00/1M' },
        rateLimit: '10 rps'
      }
    ];
  }

  // Оценка стоимости до отправки запроса
  estimateCost(messages, model = 'grok-2-1212') {
    const modelId = this.models[model] || model;
    const pricing = this.pricing[modelId] || this.pricing['grok-2-1212'];
    
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