// Shared constants between web and API
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business',
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
} as const;

export const CHAT_TYPES = {
  CLAUDE: 'claude',
  GROK: 'grok',
  BRAINSTORM: 'brainstorm',
} as const;

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

export const AI_MODELS = {
  CLAUDE: {
    SONNET_4: 'claude-4-sonnet',
    HAIKU: 'claude-3-haiku-20240307',
    OPUS: 'claude-3-opus-20240229',
  },
  GROK: {
    GROK_2: 'grok-2-1212',
    GROK_2_VISION: 'grok-2-vision-1212',
    GROK_2_IMAGE: 'grok-2-image',
  },
} as const;

export const ARTIFACT_TYPES = {
  CODE: 'code',
  MARKDOWN: 'markdown',
  REACT: 'react',
  SVG: 'svg',
  HTML: 'html',
  MERMAID: 'mermaid',
} as const;

export const BRAINSTORM_FORMATS = {
  BRAINSTORM: 'brainstorm',
  DEBATE: 'debate',
  ANALYSIS: 'analysis',
  CREATIVE: 'creative',
} as const;

export const FILE_TYPES = {
  IMAGE: 'image',
  DOCUMENT: 'document',
  CODE: 'code',
  OTHER: 'other',
} as const;

export const PLATFORM = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android',
} as const;

export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
  
  // Payment errors
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export const LIMITS = {
  FREE: {
    DAILY_MESSAGES: 10,
    MAX_TOKENS: 4096,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES_PER_PROJECT: 5,
  },
  PRO: {
    DAILY_MESSAGES: 100,
    MAX_TOKENS: 8192,
    MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
    MAX_FILES_PER_PROJECT: 20,
  },
  BUSINESS: {
    DAILY_MESSAGES: Infinity,
    MAX_TOKENS: 16384,
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_FILES_PER_PROJECT: 100,
  },
} as const;