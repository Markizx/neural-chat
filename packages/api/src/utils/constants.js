module.exports = {
  // User roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator'
  },

  // Subscription plans
  SUBSCRIPTION_PLANS: {
    FREE: 'free',
    PRO: 'pro',
    BUSINESS: 'business'
  },

  // Subscription status
  SUBSCRIPTION_STATUS: {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    PAST_DUE: 'past_due',
    TRIALING: 'trialing'
  },

  // Chat types
  CHAT_TYPES: {
    CLAUDE: 'claude',
    GROK: 'grok',
    BRAINSTORM: 'brainstorm'
  },

  // Message roles
  MESSAGE_ROLES: {
    USER: 'user',
    ASSISTANT: 'assistant',
    SYSTEM: 'system'
  },

  // AI Models
  AI_MODELS: {
    CLAUDE: {
      OPUS_4: 'claude-4-opus',
      SONNET_4: 'claude-4-sonnet',
      SONNET_3_5: 'claude-3.5-sonnet'
    },
    GROK: {
      GROK_3: 'grok-3',
      GROK_2: 'grok-2'
    }
  },

  // Usage limits
  USAGE_LIMITS: {
    FREE: {
      DAILY_MESSAGES: 10,
      MAX_TOKENS_PER_MESSAGE: 4096,
      MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
      MAX_FILES_PER_PROJECT: 5
    },
    PRO: {
      DAILY_MESSAGES: 100,
      MAX_TOKENS_PER_MESSAGE: 8192,
      MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
      MAX_FILES_PER_PROJECT: 20
    },
    BUSINESS: {
      DAILY_MESSAGES: Infinity,
      MAX_TOKENS_PER_MESSAGE: 16384,
      MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
      MAX_FILES_PER_PROJECT: 100
    }
  },

  // Error codes
  ERROR_CODES: {
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
    UPLOAD_FAILED: 'UPLOAD_FAILED'
  },

  // Regex patterns
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MONGODB_ID: /^[0-9a-fA-F]{24}$/,
    URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    HEX_COLOR: /^#[0-9A-F]{6}$/i
  },

  // Time constants
  TIME: {
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000
  },

  // Cache TTL
  CACHE_TTL: {
    USER: 5 * 60, // 5 minutes
    CHAT: 10 * 60, // 10 minutes
    MESSAGE: 30 * 60, // 30 minutes
    PROJECT: 60 * 60, // 1 hour
    SUBSCRIPTION: 5 * 60 // 5 minutes
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // File types
  FILE_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    TEXT: ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml'],
    CODE: ['text/javascript', 'text/typescript', 'text/python', 'text/html', 'text/css']
  },

  // Artifact types
  ARTIFACT_TYPES: {
    CODE: 'code',
    MARKDOWN: 'markdown',
    REACT: 'react',
    SVG: 'svg',
    HTML: 'html',
    MERMAID: 'mermaid'
  },

  // Brainstorm settings
  BRAINSTORM: {
    MIN_TURNS: 5,
    MAX_TURNS: 50,
    MIN_TURN_DURATION: 30,
    MAX_TURN_DURATION: 120,
    FORMATS: ['debate', 'brainstorm', 'analysis', 'creative']
  },

  // System messages
  SYSTEM_MESSAGES: {
    WELCOME: 'Welcome to SmartChat.ai! How can I help you today?',
    RATE_LIMIT: 'You have reached your message limit. Please upgrade your plan or wait until tomorrow.',
    ERROR: 'Something went wrong. Please try again.',
    MAINTENANCE: 'SmartChat.ai is currently under maintenance. Please check back later.'
  }
};