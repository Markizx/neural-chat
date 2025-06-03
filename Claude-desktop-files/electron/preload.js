// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Безопасное предоставление IPC API в рендерер-процесс
contextBridge.exposeInMainWorld('electronAPI', {
  // API Key operations
  getApiKey: () => ipcRenderer.invoke('auth:getApiKey'),
  setApiKey: (apiKey) => ipcRenderer.invoke('auth:setApiKey', apiKey),
  checkApiKey: (apiKey) => ipcRenderer.invoke('auth:checkApiKey', apiKey),
  
  // Chat operations
  getChats: () => ipcRenderer.invoke('chats:getAll'),
  createChat: (chat) => ipcRenderer.invoke('chats:create', chat),
  updateChat: (chat) => ipcRenderer.invoke('chats:update', chat),
  deleteChat: (chatId) => ipcRenderer.invoke('chats:delete', chatId),
  searchMessages: (query) => ipcRenderer.invoke('chats:searchMessages', query),
  
  // Message operations
  getMessages: (chatId) => ipcRenderer.invoke('messages:getByChatId', chatId),
  createMessage: (message) => ipcRenderer.invoke('messages:create', message),
  updateMessage: (message) => ipcRenderer.invoke('messages:update', message),
  deleteMessage: (messageId) => ipcRenderer.invoke('messages:delete', messageId),
  
  // Project operations
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  createProject: (project) => ipcRenderer.invoke('projects:create', project),
  updateProject: (project) => ipcRenderer.invoke('projects:update', project),
  deleteProject: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
  
  // Project file operations
  getProjectFiles: (projectId) => ipcRenderer.invoke('projectFiles:getByProjectId', projectId),
  createProjectFile: (file) => ipcRenderer.invoke('projectFiles:create', file),
  updateProjectFile: (file) => ipcRenderer.invoke('projectFiles:update', file),
  deleteProjectFile: (fileId) => ipcRenderer.invoke('projectFiles:delete', fileId),
  
  // File operations
  uploadFile: async (file) => {
    // Для объекта File из браузера
    if (file instanceof Blob) {
      // Создаем Promise для обработки файла
      return new Promise((resolve, reject) => {
        try {
          // Создаем FileReader для чтения файла как ArrayBuffer
          const reader = new FileReader();
          
          reader.onload = async () => {
            try {
              // Получаем ArrayBuffer из результата чтения
              const arrayBuffer = reader.result;
              
              // Преобразуем в массив байтов для передачи через IPC
              const byteArray = new Uint8Array(arrayBuffer);
              
              // Отправляем данные в main process
              const result = await ipcRenderer.invoke('files:upload', {
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                data: Array.from(byteArray)
              });
              
              resolve(result);
            } catch (error) {
              console.error('Error uploading file:', error);
              reject(error);
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(new Error('Failed to read file'));
          };
          
          // Читаем файл как ArrayBuffer
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.error('Error preparing file upload:', error);
          reject(error);
        }
      });
    } else if (file && file.path) {
      // Если уже есть путь к файлу (например, из диалога выбора файла)
      return ipcRenderer.invoke('files:upload', file);
    } else {
      // Прочие случаи
      return ipcRenderer.invoke('files:upload', file);
    }
  },
  
  downloadFile: (filePath) => ipcRenderer.invoke('files:download', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('files:saveFile', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('files:delete', filePath),
  openFileDialog: (options) => ipcRenderer.invoke('files:openDialog', options),
  saveFileDialog: (defaultPath, filters) => ipcRenderer.invoke('files:saveDialog', defaultPath, filters),
  createTempFile: (name, data) => ipcRenderer.invoke('files:createTempFile', { name, data }),
  
  // Claude AI operations - ИСПРАВЛЕНО!
  sendToClaudeAI: (params) => {
    // Если передаются отдельные параметры, собираем их в объект
    if (arguments.length === 3) {
      const [content, attachments, history] = arguments;
      console.log('preload: sendToClaudeAI вызван с 3 параметрами, конвертируем в объект');
      return ipcRenderer.invoke('api:sendToClaudeAI', { content, attachments, history });
    }
    // Если уже объект
    console.log('preload: sendToClaudeAI вызван с объектом:', params);
    return ipcRenderer.invoke('api:sendToClaudeAI', params);
  },
  
  // Settings operations
  getSettings: () => {
    console.log('preload: получение настроек');
    return ipcRenderer.invoke('settings:getAll').then(result => {
      console.log('preload: настройки получены:', result);
      return result;
    }).catch(error => {
      console.error('preload: ошибка получения настроек:', error);
      throw error;
    });
  },
  
  updateSettings: (settings) => {
    console.log('preload: обновление настроек:', settings);
    return ipcRenderer.invoke('settings:update', settings).then(result => {
      console.log('preload: результат обновления настроек:', result);
      
      // КРИТИЧНО: Синхронизируем с API handler сразу после успешного сохранения
      if (result.success) {
        return ipcRenderer.invoke('api:updateSettings', settings).then(apiResult => {
          console.log('preload: результат синхронизации с API handler:', apiResult);
          return result; // Возвращаем оригинальный результат
        }).catch(error => {
          console.warn('preload: ошибка синхронизации с API handler:', error);
          return result; // Возвращаем оригинальный результат даже при ошибке синхронизации
        });
      }
      
      return result;
    }).catch(error => {
      console.error('preload: ошибка обновления настроек:', error);
      throw error;
    });
  },
  
  updateSetting: (key, value) => {
    console.log(`preload: обновление настройки ${key}:`, value);
    return ipcRenderer.invoke('settings:updateSingle', { key, value }).then(result => {
      console.log(`preload: результат обновления настройки ${key}:`, result);
      
      // КРИТИЧНО: Синхронизируем с API handler сразу после успешного сохранения
      if (result.success) {
        // Получаем все настройки и отправляем в API handler
        return ipcRenderer.invoke('settings:getAll').then(allSettings => {
          return ipcRenderer.invoke('api:updateSettings', allSettings).then(apiResult => {
            console.log('preload: результат синхронизации настройки с API handler:', apiResult);
            return result; // Возвращаем оригинальный результат
          }).catch(error => {
            console.warn('preload: ошибка синхронизации настройки с API handler:', error);
            return result; // Возвращаем оригинальный результат даже при ошибке синхронизации
          });
        }).catch(error => {
          console.warn('preload: ошибка получения всех настроек для синхронизации:', error);
          return result;
        });
      }
      
      return result;
    }).catch(error => {
      console.error(`preload: ошибка обновления настройки ${key}:`, error);
      return { success: false, error: error.message };
    });
  },
  
  resetSettings: () => {
    console.log('preload: сброс настроек');
    return ipcRenderer.invoke('settings:reset').then(result => {
      console.log('preload: результат сброса настроек:', result);
      
      // КРИТИЧНО: Синхронизируем с API handler сразу после успешного сброса
      if (result.success) {
        // Получаем дефолтные настройки и отправляем в API handler
        const defaultSettings = {
          model: 'claude-3-7-sonnet-20250219',
          maxTokens: 4096,
          temperature: 0.7,
          topP: 1.0,
          language: 'ru',
          theme: 'dark',
          autoSave: true,
          confirmDelete: true,
          messageAnimation: true,
          compactMode: false,
          showTimestamps: true,
          fontSize: 14,
          soundEnabled: true,
          desktopNotifications: true,
          autoBackup: false,
          backupInterval: 24,
          maxBackups: 10,
        };
        
        return ipcRenderer.invoke('api:updateSettings', defaultSettings).then(apiResult => {
          console.log('preload: результат синхронизации сброшенных настроек с API handler:', apiResult);
          return result; // Возвращаем оригинальный результат
        }).catch(error => {
          console.warn('preload: ошибка синхронизации сброшенных настроек с API handler:', error);
          return result; // Возвращаем оригинальный результат даже при ошибке синхронизации
        });
      }
      
      return result;
    }).catch(error => {
      console.error('preload: ошибка сброса настроек:', error);
      throw error;
    });
  },
  
  // Database operations
  backupDatabase: (path) => ipcRenderer.invoke('db:backup', path),
  restoreDatabase: (path) => ipcRenderer.invoke('db:restore', path),
  
  // Export operations
  exportChat: (chatId, format, options) => 
    ipcRenderer.invoke('export:chat', chatId, format, options),
  
  // Artifact operations
  downloadArtifact: (artifactId) => ipcRenderer.invoke('artifacts:download', artifactId),
  saveArtifact: (artifact) => ipcRenderer.invoke('artifacts:save', artifact),
  
  // App utilities
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  openExternalLink: (url) => ipcRenderer.invoke('app:openExternal', url),
  showNotification: (title, body) => ipcRenderer.invoke('app:showNotification', { title, body }),
  restartApp: () => ipcRenderer.invoke('app:restart'),
});

// Предоставление базовой информации об ОС
contextBridge.exposeInMainWorld('systemInfo', {
  platform: process.platform,
  arch: process.arch,
  version: process.version
});

// Debugging info
console.log('Preload script executed successfully');
console.log('electronAPI exposed with enhanced settings methods');