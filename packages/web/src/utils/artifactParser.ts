import { Artifact as SharedArtifact, ArtifactType } from '@neuralchat/shared/types';

export interface Artifact extends Omit<SharedArtifact, 'type'> {
  type: ArtifactType;
  content: string; // Обязательно для парсера
  rawMatch?: string; // Дополнительное поле для парсера
}

export const extractArtifacts = (content: string): Artifact[] => {
  if (!content || typeof content !== 'string') return [];
  
  const artifacts: Artifact[] = [];
  
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
      const rawType = attributes.type || 'text/plain';
      artifacts.push({
        id: attributes.identifier,
        type: processArtifactType(rawType, artifactContent),
        title: attributes.title || '',
        language: attributes.language || detectLanguage(artifactContent),
        content: artifactContent.trim(),
        rawMatch: fullMatch
      });
    }
  }
  
  return artifacts;
};

const extractArtifactAttributes = (attributeString: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  
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

export const removeArtifactsFromText = (content: string, artifacts: Artifact[]): string => {
  let cleanContent = content;
  
  artifacts.forEach(artifact => {
    if (artifact.rawMatch) {
      cleanContent = cleanContent.replace(artifact.rawMatch, '');
    }
  });
  
  return cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
};

export const detectLanguage = (content: string): string => {
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
  
  // SVG (специальная обработка)
  if (contentLower.includes('<svg') && contentLower.includes('</svg>')) {
    return 'svg';
  }
  
  return 'text';
};

// Преобразует SVG типы в правильный формат для рендеринга
export const processArtifactType = (type: string, content: string): ArtifactType => {
  if (type === 'image/svg+xml' || (type === 'text/plain' && content.includes('<svg'))) {
    return 'svg';
  }
  
  if (type === 'application/vnd.ant.code') {
    return 'code';
  }
  
  if (type === 'application/vnd.ant.react') {
    return 'react';
  }
  
  if (type === 'text/html') {
    return 'html';
  }
  
  if (type === 'text/markdown') {
    return 'markdown';
  }
  
  if (type === 'application/vnd.ant.mermaid') {
    return 'mermaid';
  }
  
  return 'code'; // Дефолт для неизвестных типов
}; 