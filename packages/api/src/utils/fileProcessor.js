const fs = require('fs');
const path = require('path');

/**
 * Читает содержимое файла и возвращает его в виде текста
 * @param {string} filePath - путь к файлу
 * @param {string} mimeType - MIME тип файла
 * @returns {Promise<string>} содержимое файла
 */
async function readFileContent(filePath, mimeType) {
  try {
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return null;
    }

    // Определяем, можно ли читать файл как текст
    if (isTextFile(mimeType)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return content;
    }

    // Для бинарных файлов возвращаем информацию о файле
    const stats = fs.statSync(filePath);
    return `[Binary file: ${path.basename(filePath)}, size: ${formatFileSize(stats.size)}]`;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return `[Error reading file: ${path.basename(filePath)}]`;
  }
}

/**
 * Проверяет, является ли файл текстовым
 * @param {string} mimeType - MIME тип файла
 * @returns {boolean}
 */
function isTextFile(mimeType) {
  const textTypes = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript',
    'application/x-python',
    'application/x-java',
    'application/x-c',
    'application/x-cpp',
    'application/x-csharp',
    'application/x-php',
    'application/x-ruby',
    'application/x-go',
    'application/x-rust',
    'application/x-swift',
    'application/x-kotlin',
    'application/x-scala',
    'application/x-perl',
    'application/x-lua',
    'application/x-shell',
    'application/x-yaml',
    'application/x-toml',
    'application/x-ini',
    'application/x-dockerfile',
    'application/x-makefile'
  ];

  return textTypes.some(type => mimeType.startsWith(type));
}

/**
 * Форматирует размер файла
 * @param {number} bytes - размер в байтах
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Обрабатывает файлы проекта и извлекает их содержимое
 * @param {Array} projectFiles - массив файлов проекта
 * @returns {Promise<Array>} массив файлов с содержимым
 */
async function processProjectFiles(projectFiles) {
  if (!projectFiles || projectFiles.length === 0) {
    return [];
  }

  const processedFiles = [];

  for (const file of projectFiles) {
    try {
      // Получаем содержимое файла
      const content = await readFileContent(file.url || file.path, file.type || file.mimeType);
      
      processedFiles.push({
        ...file,
        content: content,
        isProcessed: true
      });
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      processedFiles.push({
        ...file,
        content: `[Error processing file: ${file.name}]`,
        isProcessed: false
      });
    }
  }

  return processedFiles;
}

/**
 * Создает контекст из файлов проекта для AI
 * @param {Array} projectFiles - массив обработанных файлов проекта
 * @param {string} projectName - название проекта
 * @returns {string} текстовый контекст
 */
function createProjectContext(projectFiles, projectName = 'Project') {
  if (!projectFiles || projectFiles.length === 0) {
    return '';
  }

  let context = `\n\n--- ${projectName} Context ---\n`;
  context += `The following files from the project "${projectName}" are provided as context:\n\n`;

  for (const file of projectFiles) {
    context += `## File: ${file.name}\n`;
    if (file.type) {
      context += `Type: ${file.type}\n`;
    }
    if (file.size) {
      context += `Size: ${formatFileSize(file.size)}\n`;
    }
    context += `\n\`\`\`\n${file.content || '[No content available]'}\n\`\`\`\n\n`;
  }

  context += `--- End of ${projectName} Context ---\n\n`;
  return context;
}

/**
 * Определяет тип файла по расширению
 * @param {string} filename - имя файла
 * @returns {string} MIME тип
 */
function getMimeTypeFromExtension(filename) {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.py': 'application/x-python',
    '.java': 'application/x-java',
    '.c': 'application/x-c',
    '.cpp': 'application/x-cpp',
    '.h': 'application/x-c',
    '.hpp': 'application/x-cpp',
    '.cs': 'application/x-csharp',
    '.php': 'application/x-php',
    '.rb': 'application/x-ruby',
    '.go': 'application/x-go',
    '.rs': 'application/x-rust',
    '.swift': 'application/x-swift',
    '.kt': 'application/x-kotlin',
    '.scala': 'application/x-scala',
    '.pl': 'application/x-perl',
    '.lua': 'application/x-lua',
    '.sh': 'application/x-shell',
    '.bash': 'application/x-shell',
    '.zsh': 'application/x-shell',
    '.fish': 'application/x-shell',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.scss': 'text/css',
    '.sass': 'text/css',
    '.less': 'text/css',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.toml': 'application/x-toml',
    '.ini': 'application/x-ini',
    '.cfg': 'application/x-ini',
    '.conf': 'application/x-ini',
    '.dockerfile': 'application/x-dockerfile',
    '.makefile': 'application/x-makefile',
    '.gitignore': 'text/plain',
    '.env': 'text/plain',
    '.log': 'text/plain',
    '.csv': 'text/csv',
    '.sql': 'application/sql',
    '.graphql': 'application/graphql',
    '.gql': 'application/graphql'
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  readFileContent,
  isTextFile,
  formatFileSize,
  processProjectFiles,
  createProjectContext,
  getMimeTypeFromExtension
}; 