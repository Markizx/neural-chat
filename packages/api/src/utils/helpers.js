const crypto = require('crypto');
const { REGEX } = require('./constants');

// Generate random string
exports.generateRandomString = (length = 10) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

// Generate unique ID
exports.generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const randomStr = this.generateRandomString(6);
  return prefix ? `${prefix}_${timestamp}${randomStr}` : `${timestamp}${randomStr}`;
};

// Validate email
exports.isValidEmail = (email) => {
  return REGEX.EMAIL.test(email);
};

// Validate MongoDB ObjectId
exports.isValidObjectId = (id) => {
  return REGEX.MONGODB_ID.test(id);
};

// Validate URL
exports.isValidUrl = (url) => {
  return REGEX.URL.test(url);
};

// Sanitize string
exports.sanitizeString = (str) => {
  if (!str) return '';
  return str
    .trim()
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ');
};

// Truncate string
exports.truncateString = (str, length = 100, suffix = '...') => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
};

// Calculate read time
exports.calculateReadTime = (text, wordsPerMinute = 200) => {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

// Format bytes
exports.formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Parse sort string
exports.parseSort = (sortString = '-createdAt') => {
  const sort = {};
  const fields = sortString.split(',');
  
  fields.forEach(field => {
    if (field.startsWith('-')) {
      sort[field.substring(1)] = -1;
    } else {
      sort[field] = 1;
    }
  });
  
  return sort;
};

// Parse filters
exports.parseFilters = (query) => {
  const filters = {};
  const excludeFields = ['page', 'limit', 'sort', 'fields'];
  
  Object.keys(query).forEach(key => {
    if (!excludeFields.includes(key)) {
      // Handle operators (gte, lte, gt, lt, ne)
      if (typeof query[key] === 'string' && query[key].includes(':')) {
        const [operator, value] = query[key].split(':');
        filters[key] = { [`$${operator}`]: value };
      } else {
        filters[key] = query[key];
      }
    }
  });
  
  return filters;
};

// Get date range
exports.getDateRange = (period = 'day') => {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'hour':
      start.setHours(start.getHours() - 1);
      break;
    case 'day':
      start.setDate(start.getDate() - 1);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 1);
  }
  
  return { start, end: now };
};

// Calculate percentage
exports.calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Group by key
exports.groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) result[group] = [];
    result[group].push(item);
    return result;
  }, {});
};

// Sleep function
exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function
exports.retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await this.sleep(delay);
    return this.retry(fn, retries - 1, delay * 2);
  }
};

// Chunk array
exports.chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Deep merge objects
exports.deepMerge = (target, source) => {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = this.deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

// Check if object
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Extract mentions from text
exports.extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};

// Extract hashtags from text
exports.extractHashtags = (text) => {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  
  return hashtags;
};

// Calculate token count (approximate)
exports.estimateTokens = (text) => {
  if (!text) return 0;
  
  // Rough estimation: ~4 characters per token
  const charCount = text.length;
  const wordCount = text.split(/\s+/).length;
  
  // Use average of character and word-based estimates
  const charEstimate = Math.ceil(charCount / 4);
  const wordEstimate = Math.ceil(wordCount * 1.3);
  
  return Math.ceil((charEstimate + wordEstimate) / 2);
};

// Mask sensitive data
exports.maskSensitiveData = (data, fieldsToMask = ['password', 'token', 'secret', 'key']) => {
  if (!data || typeof data !== 'object') return data;
  
  const masked = { ...data };
  
  Object.keys(masked).forEach(key => {
    if (fieldsToMask.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = this.maskSensitiveData(masked[key], fieldsToMask);
    }
  });
  
  return masked;
};

// Get client IP
exports.getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip;
};

// Parse user agent
exports.parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  const browser = {
    chrome: ua.includes('chrome'),
    firefox: ua.includes('firefox'),
    safari: ua.includes('safari') && !ua.includes('chrome'),
    edge: ua.includes('edge'),
    ie: ua.includes('msie') || ua.includes('trident')
  };
  
  const os = {
    windows: ua.includes('windows'),
    mac: ua.includes('mac'),
    linux: ua.includes('linux'),
    ios: ua.includes('iphone') || ua.includes('ipad'),
    android: ua.includes('android')
  };
  
  const device = {
    mobile: ua.includes('mobile'),
    tablet: ua.includes('tablet') || ua.includes('ipad'),
    desktop: !ua.includes('mobile') && !ua.includes('tablet')
  };
  
  return { browser, os, device };
};

// Convert to boolean
exports.toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return !!value;
};

// Safe JSON parse
exports.safeJsonParse = (str, defaultValue = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

// Create slug from text
exports.createSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Calculate cost for tokens
exports.calculateTokenCost = (tokens, model) => {
  const pricing = {
    'claude-4-sonnet': { input: 0.015, output: 0.075 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'grok-2-1212': { input: 0.002, output: 0.01 },
    'grok-2-vision': { input: 0.005, output: 0.015 },
    'grok-2-image': { input: 0.005, output: 0.015 }
  };
  
  const modelPricing = pricing[model] || { input: 0.001, output: 0.002 };
  
  // Assume 50/50 split between input and output for estimation
  const inputTokens = Math.ceil(tokens * 0.3);
  const outputTokens = Math.ceil(tokens * 0.7);
  
  const inputCost = (inputTokens / 1000) * modelPricing.input;
  const outputCost = (outputTokens / 1000) * modelPricing.output;
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: tokens,
    cost: inputCost + outputCost,
    breakdown: {
      input: inputCost,
      output: outputCost
    }
  };
};

// Validate and clean project name
exports.validateProjectName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Project name is required' };
  }
  
  const cleaned = name.trim();
  
  if (cleaned.length < 3) {
    return { isValid: false, error: 'Project name must be at least 3 characters' };
  }
  
  if (cleaned.length > 50) {
    return { isValid: false, error: 'Project name must be less than 50 characters' };
  }
  
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(cleaned)) {
    return { isValid: false, error: 'Project name can only contain letters, numbers, spaces, hyphens and underscores' };
  }
  
  return { isValid: true, cleaned };
};