// electron/ipc/api.js
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Store = require('electron-store');

// Импортируем функции для парсинга артефактов вручную (без ES6 модулей)
const extractArtifacts = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  const artifacts = [];
  
  // Регулярное выражение для поиска артефактов
  const artifactRegex = /<artifact([^>]*?)>([\s\S]*?)<\/artifact>/g;
  
  let match;
  while ((match = artifactRegex.exec(content)) !== null) {
    const attributeString = match[1];
    const artifactContent = match[2];
    const fullMatch = match[0];
    
    // Извлекаем атрибуты
    const attributes = extractArtifactAttributes(attributeString);
    
    if (attributes.identifier) {
      artifacts.push({
        id: attributes.identifier,
        type: attributes.type || 'text/plain',
        title: attributes.title || '',
        language: attributes.language || detectLanguage(artifactContent),
        content: artifactContent.trim(),
        rawMatch: fullMatch
      });
    }
  }
  
  return artifacts;
};

const extractArtifactAttributes = (attributeString) => {
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
};

const removeArtifactsFromText = (content, artifacts) => {
  let cleanContent = content;
  
  artifacts.forEach(artifact => {
    if (artifact.rawMatch) {
      cleanContent = cleanContent.replace(artifact.rawMatch, '');
    }
  });
  
  return cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
};

const detectLanguage = (content) => {
  if (!content || typeof content !== 'string') return 'text';
  
  const contentLower = content.toLowerCase();
  
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
};

// Безопасное хранилище
const store = new Store({
  name: 'claude-desktop-config'
});

// Claude API handler
class ClaudeAPIHandler {
  constructor() {
    this.baseUrl = 'https://api.anthropic.com';
    this.apiVersion = '2023-06-01';
    
    // Инициализируем пустой кеш настроек
    this.cachedSettings = {};
    
    console.log('ClaudeAPIHandler инициализирован БЕЗ принудительных дефолтных настроек');
  }

  // Get API key
  async getApiKey() {
    const encryptedKey = store.get('claudeApiKey');
    if (!encryptedKey) return '';
    
    try {
      return encryptedKey;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return '';
    }
  }
  
  // Set API key
  async setApiKey(apiKey) {
    try {
      store.set('claudeApiKey', apiKey);
      return { success: true };
    } catch (error) {
      console.error('Error setting API key:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check API key validity
  async checkApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/messages`,
        {
          model: 'claude-3-haiku-20240307', // Используем быструю модель для проверки
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'API key verification test.'
                }
              ]
            }
          ]
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Invalid API key');
        return false;
      }
      
      if (error.response) {
        console.error('API responded with error, but key might be valid:', error.response.status);
        return true;
      }
      
      console.error('Error checking API key:', error);
      return false;
    }
  }

  // Получение настроек с приоритетом кеша
  async getSettings() {
    try {
      // Если есть кешированные настройки, используем их
      if (this.cachedSettings && Object.keys(this.cachedSettings).length > 0) {
        console.log('ClaudeAPIHandler: используем кешированные настройки:', this.cachedSettings);
        return this.cachedSettings;
      }
      
      // Иначе пытаемся получить из storageManager
      if (global.storageManager) {
        const settings = global.storageManager.getAllSettings();
        if (settings && Object.keys(settings).length > 0) {
          this.cachedSettings = { ...settings };
          console.log('ClaudeAPIHandler: настройки получены из storageManager и кешированы:', this.cachedSettings);
          return this.cachedSettings;
        }
      }
      
      // Если ничего нет, возвращаем пустой объект
      console.log('ClaudeAPIHandler: настройки не найдены, возвращаем пустой объект');
      return {};
    } catch (error) {
      console.error('Error getting settings for API:', error);
      return {};
    }
  }

  // Обновление кешированных настроек
  updateCachedSettings(newSettings) {
    if (newSettings && typeof newSettings === 'object') {
      // Полностью заменяем кеш новыми настройками
      this.cachedSettings = { ...newSettings };
      console.log('ClaudeAPIHandler: кеш настроек полностью обновлен:', this.cachedSettings);
      return true;
    } else {
      console.error('ClaudeAPIHandler: неверный формат настроек для обновления:', newSettings);
      return false;
    }
  }

  // Проверка модели на принадлежность к Claude 4
  isClaude4Model(modelName) {
    return modelName && (
      modelName.includes('claude-opus-4') || 
      modelName.includes('claude-sonnet-4') ||
      modelName.includes('claude-4')
    );
  }

  // Send message to Claude API
  async sendMessageToClaudeAI(params) {
    // ИСПРАВЛЕНО: обрабатываем объект параметров
    let content, attachments, history;
    
    if (typeof params === 'object' && params !== null) {
      content = params.content || '';
      attachments = params.attachments || [];
      history = params.history || [];
    } else {
      // Если передана строка, используем её как content
      content = String(params || '');
      attachments = [];
      history = [];
    }

    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Claude API key is not configured. Please update your settings.');
    }

    console.log('sendMessageToClaudeAI вызван с параметрами:', {
      contentLength: content?.length || 0,
      contentType: typeof content,
      attachmentsCount: attachments?.length || 0,
      historyLength: history?.length || 0
    });

    // ВАЖНО: Проверяем наличие контента
    if (!content || (typeof content === 'string' && !content.trim())) {
      throw new Error('Сообщение не может быть пустым');
    }

    // Prepare message content array
    const messageContent = [];
    
    // Разделяем файлы сообщения и файлы проекта
    const messageFiles = [];
    const projectFiles = [];
    
    if (attachments && attachments.length > 0) {
      attachments.forEach(attachment => {
        if (attachment.isProjectFile) {
          projectFiles.push(attachment);
        } else {
          messageFiles.push(attachment);
        }
      });
    }
    
    console.log('Разделили файлы:', {
      messageFilesCount: messageFiles.length,
      projectFilesCount: projectFiles.length
    });
    
    // Добавляем КОНТЕКСТ ПРОЕКТА В НАЧАЛО, если есть файлы проекта
    if (projectFiles.length > 0) {
      let projectContext = '=== КОНТЕКСТ ПРОЕКТА ===\n\n';
      
      for (const projectFile of projectFiles) {
        try {
          if (!projectFile.path || !fs.existsSync(projectFile.path)) {
            console.warn(`Project file not found: ${projectFile.path}`);
            projectContext += `[ФАЙЛ ПРОЕКТА НЕДОСТУПЕН: ${projectFile.name}]\n\n`;
            continue;
          }
          
          const fileBuffer = fs.readFileSync(projectFile.path);
          const mediaType = this.getMediaType(projectFile.type, projectFile.name);
          
          console.log(`Обрабатываем файл проекта: ${projectFile.name} (${mediaType})`);
          
          if (this.isImageFile(mediaType)) {
            // Для изображений добавляем как отдельный элемент контента
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: fileBuffer.toString('base64')
              }
            });
            projectContext += `[ИЗОБРАЖЕНИЕ ПРОЕКТА: ${projectFile.name}]\n\n`;
          } else {
            // Для текстовых документов - добавляем в текстовый контекст
            try {
              const textContent = fileBuffer.toString('utf8');
              projectContext += `### ФАЙЛ ПРОЕКТА: ${projectFile.name} ###\n${textContent}\n### КОНЕЦ ФАЙЛА: ${projectFile.name} ###\n\n`;
            } catch (error) {
              console.error(`Error converting project file ${projectFile.name} to text:`, error);
              projectContext += `[ФАЙЛ ПРОЕКТА (бинарный): ${projectFile.name}, тип: ${mediaType}, размер: ${fileBuffer.length} байт]\n\n`;
            }
          }
        } catch (fileError) {
          console.error(`Error processing project file ${projectFile.name}:`, fileError);
          projectContext += `[ОШИБКА ОБРАБОТКИ ФАЙЛА ПРОЕКТА: ${projectFile.name}]\n\n`;
        }
      }
      
      projectContext += '=== КОНЕЦ КОНТЕКСТА ПРОЕКТА ===\n\n';
      
      // Добавляем контекст проекта как первый текстовый элемент
      messageContent.push({
        type: 'text',
        text: projectContext
      });
    }
    
    // Добавляем ОБЫЧНЫЕ ПРИКРЕПЛЕННЫЕ ФАЙЛЫ
    if (messageFiles.length > 0) {
      let attachmentsContext = '';
      
      for (const attachment of messageFiles) {
        try {
          if (!attachment.path || !fs.existsSync(attachment.path)) {
            console.warn(`Message file not found: ${attachment.path}`);
            continue;
          }
          
          const fileBuffer = fs.readFileSync(attachment.path);
          const mediaType = this.getMediaType(attachment.type, attachment.name);
          
          console.log(`Обрабатываем прикрепленный файл: ${attachment.name} (${mediaType})`);
          
          if (this.isImageFile(mediaType)) {
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: fileBuffer.toString('base64')
              }
            });
          } else {
            try {
              const textContent = fileBuffer.toString('utf8');
              attachmentsContext += `### ПРИКРЕПЛЕННЫЙ ФАЙЛ: ${attachment.name} ###\n${textContent}\n### КОНЕЦ ФАЙЛА: ${attachment.name} ###\n\n`;
            } catch (error) {
              console.error(`Error converting message file ${attachment.name} to text:`, error);
              attachmentsContext += `[ПРИКРЕПЛЕННЫЙ ФАЙЛ (бинарный): ${attachment.name}, тип: ${mediaType}, размер: ${fileBuffer.length} байт]\n\n`;
            }
          }
        } catch (fileError) {
          console.error(`Error processing message file ${attachment.name}:`, fileError);
        }
      }
      
      if (attachmentsContext) {
        messageContent.push({
          type: 'text',
          text: attachmentsContext
        });
      }
    }
    
    // Добавляем ОСНОВНОЙ ТЕКСТ СООБЩЕНИЯ
    messageContent.push({
      type: 'text',
      text: String(content) // Принудительно преобразуем в строку
    });
    
    console.log(`Подготовлено содержимое сообщения с ${messageContent.length} элементами`);
    
    // Prepare conversation history in Claude's format
    const messages = [];
    
    // Add conversation history
    if (history && history.length > 0) {
      for (const message of history) {
        if (!message || !message.role || !message.content) continue;
        
        // Пропускаем сообщения с пустым контентом
        if (typeof message.content === 'string' && !message.content.trim()) {
          continue;
        }
        
        const messageObj = {
          role: message.role,
          content: []
        };
        
        if (typeof message.content === 'string') {
          messageObj.content.push({ 
            type: 'text', 
            text: message.content 
          });
        } else if (Array.isArray(message.content)) {
          messageObj.content = message.content;
        }
        
        messages.push(messageObj);
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: messageContent
    });
    
    // Получаем актуальные настройки
    const settings = await this.getSettings();
    console.log('Получены настройки для API запроса:', settings);
    
    // Используем настройки БЕЗ принудительных значений по умолчанию
    const modelName = settings.model || 'claude-3-sonnet-20240229';
    const maxTokens = settings.maxTokens || 4096;
    const temperature = settings.temperature || 0.7;
    const topP = settings.topP || 1.0;
    
    // Специальная обработка для Claude 4
    const isClaude4 = this.isClaude4Model(modelName);
    
    // Системное сообщение с улучшенными инструкциями
    let systemPrompt = `Ты полезный ассистент Claude. 

ВАЖНЫЕ ИНСТРУКЦИИ:
1. Если в сообщении есть секция "=== КОНТЕКСТ ПРОЕКТА ===", то файлы в этой секции - это файлы проекта пользователя. Используй их как справочную информацию для понимания контекста работы.

2. Если есть "ПРИКРЕПЛЕННЫЕ ФАЙЛЫ", то это файлы, которые пользователь специально прикрепил к текущему сообщению.

3. Анализируй ВСЕ предоставленные файлы (и проекта, и прикрепленные) для формирования ответа.

4. Если пользователь задает вопросы о коде или проекте, обязательно используй информацию из файлов проекта.

Правила для артефактов:
- Используй тег <artifact> для создания кода, документов и визуализаций
- Обязательные атрибуты: identifier (уникальный ID), type, title
- Поддерживаемые типы:
  * application/vnd.ant.code - для кода (добавь language="язык")
  * text/markdown - для документов
  * application/vnd.ant.react - для React компонентов
  * image/svg+xml - для SVG
  * text/html - для HTML страниц

Всегда отвечай на русском языке, если не попросят иначе.`;

    // Дополнительные инструкции для Claude 4
    if (isClaude4) {
      systemPrompt += `\n\nТы используешь модель ${modelName} из семейства Claude 4. Используй свои расширенные возможности для:
- Более глубокого понимания контекста
- Генерации более сложного и качественного кода
- Работы с большими объемами данных
- Решения комплексных задач требующих многоэтапного мышления`;
    }
    
    console.log(`ВАЖНО: Используется модель из настроек: ${modelName} (Claude 4: ${isClaude4})`);
    
    // Make API request to Claude
    try {
      console.log(`Отправляем запрос к Claude API с моделью: ${modelName}, файлов проекта: ${projectFiles.length}, обычных файлов: ${messageFiles.length}`);
      
      const requestData = {
        model: modelName,
        max_tokens: maxTokens,
        messages: messages,
        system: systemPrompt,
        temperature: temperature,
        top_p: topP
      };
      
      // Для Claude 4 можем использовать увеличенные лимиты токенов
      if (isClaude4 && maxTokens < 8192) {
        requestData.max_tokens = 8192;
        console.log('Claude 4: увеличиваем лимит токенов до 8192');
      }
      
      console.log('Request data summary:', {
        model: requestData.model,
        max_tokens: requestData.max_tokens,
        temperature: requestData.temperature,
        top_p: requestData.top_p,
        messagesCount: requestData.messages.length,
        currentMessageContentParts: messageContent.length,
        isClaude4: isClaude4
      });
      
      const response = await axios.post(
        `${this.baseUrl}/v1/messages`,
        requestData,
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json'
          },
          timeout: isClaude4 ? 120000 : 60000 // Увеличенный таймаут для Claude 4
        }
      );
      
      // Extract and return Claude's response
      if (response.data && response.data.content && response.data.content.length > 0) {
        const textContent = response.data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');
          
        console.log('УСПЕХ: Получен ответ от Claude API, фактическая модель:', response.data.model);
        console.log('Файлы проекта были переданы в контексте:', projectFiles.length > 0);
        
        // Парсим артефакты из ответа
        console.log('🎨 Парсим артефакты из ответа Claude...');
        const artifacts = extractArtifacts(textContent);
        const cleanContent = removeArtifactsFromText(textContent, artifacts);
        
        console.log(`🎨 Найдено артефактов: ${artifacts.length}`);
        if (artifacts.length > 0) {
          console.log('🎨 Артефакты:', artifacts.map(a => ({ id: a.id, type: a.type, title: a.title })));
        }
        
        return {
          id: response.data.id,
          content: cleanContent.trim(),
          artifacts: artifacts, // Добавляем артефакты в ответ
          model: response.data.model,
          stopReason: response.data.stop_reason,
          usage: response.data.usage
        };
      } else {
        throw new Error('Received invalid response from Claude API');
      }
    } catch (error) {
      console.error('Error sending message to Claude API:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.data && error.response.data.error) {
          throw new Error(`API Error: ${error.response.data.error.message || error.response.data.error.type}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: API request took too long to complete');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Network error: Could not connect to API server');
      }
      
      throw error;
    }
  }
  
  // Helper to determine media type
  getMediaType(mimeType, fileName) {
    if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
    
    const ext = path.extname(fileName || '').toLowerCase();
    
    const mimeTypes = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.jsx': 'text/javascript',
      '.ts': 'text/javascript',
      '.tsx': 'text/javascript',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  // Helper to determine if file is an image
  isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }
}

// Создаем экземпляр обработчика
const apiHandler = new ClaudeAPIHandler();

// Сохраняем ссылку в global для доступа из других модулей
global.apiHandler = apiHandler;

// Функция для регистрации обработчиков IPC
function register(ipcMainInstance, storageManagerRef = null) {
  // Сохраняем ссылку на storageManager для доступа к настройкам
  if (storageManagerRef) {
    global.storageManager = storageManagerRef;
    console.log('API handler связан с storageManager');
  }

  // API Key handling
  ipcMainInstance.handle('auth:getApiKey', async () => {
    try {
      return await apiHandler.getApiKey();
    } catch (error) {
      console.error('Error getting API key:', error);
      return '';
    }
  });

  ipcMainInstance.handle('auth:setApiKey', async (_event, apiKey) => {
    try {
      return await apiHandler.setApiKey(apiKey);
    } catch (error) {
      console.error('Error setting API key:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMainInstance.handle('auth:checkApiKey', async (_event, apiKey) => {
    try {
      return await apiHandler.checkApiKey(apiKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  });
  
  // Send message to Claude AI - ИСПРАВЛЕНО
  ipcMainInstance.handle('api:sendToClaudeAI', async (_event, params) => {
    try {
      console.log('IPC handler api:sendToClaudeAI получил:', typeof params, params);
      return await apiHandler.sendMessageToClaudeAI(params);
    } catch (error) {
      console.error('Claude API error:', error);
      return { error: error.message || 'Unknown error' };
    }
  });

  // Обработчик для обновления кешированных настроек в API handler
  ipcMainInstance.handle('api:updateSettings', async (_event, settings) => {
    try {
      console.log('API handler получил полное обновление настроек:', settings);
      const success = apiHandler.updateCachedSettings(settings);
      console.log('API handler обновил кеш настроек, результат:', success);
      return { success };
    } catch (error) {
      console.error('Error updating API settings cache:', error);
      return { success: false, error: error.message };
    }
  });
}

// Экспортируем
module.exports = {
  register,
  apiHandler
};