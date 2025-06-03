export const APP_NAME = 'NeuralChat';
export const APP_VERSION = '1.0.0';

// API endpoints
export const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business',
} as const;

// Message limits
export const MESSAGE_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: 10,
  [SUBSCRIPTION_PLANS.PRO]: 100,
  [SUBSCRIPTION_PLANS.BUSINESS]: Infinity,
} as const;

// AI Models
export const AI_MODELS = {
  CLAUDE: {
    'claude-4-sonnet': 'Claude 4 Sonnet',
    'claude-3-haiku-20240307': 'Claude 3 Haiku',
    'claude-3-opus-20240229': 'Claude 3 Opus',
  },
  GROK: {
    'grok-2-1212': 'Grok 2',
    'grok-2-vision-1212': 'Grok 2 Vision',
  },
} as const;

// File upload limits
export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 10,
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
  ],
} as const;

// Brainstorm settings
export const BRAINSTORM_SETTINGS = {
  MIN_TURNS: 5,
  MAX_TURNS: 50,
  DEFAULT_TURNS: 20,
  MIN_TURN_DURATION: 30,
  MAX_TURN_DURATION: 120,
  DEFAULT_TURN_DURATION: 60,
  FORMATS: ['brainstorm', 'debate', 'analysis', 'creative'] as const,
} as const;

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#ec4899',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'neuralchat_access_token',
  REFRESH_TOKEN: 'neuralchat_refresh_token',
  THEME: 'neuralchat_theme',
  LANGUAGE: 'neuralchat_language',
  RECENT_CHATS: 'neuralchat_recent_chats',
  USER_PREFERENCES: 'neuralchat_user_preferences',
} as const;

// Route paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHAT_CLAUDE: '/chat/claude',
  CHAT_GROK: '/chat/grok',
  BRAINSTORM: '/brainstorm',
  PROJECTS: '/projects',
  SETTINGS: '/settings',
  SUBSCRIPTION: '/subscription',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  SUBSCRIPTION_REQUIRED: 'This feature requires a subscription.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

// Regex patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  PHONE: /^\+?[\d\s-()]+$/,
} as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints
export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;

// Z-index values
export const Z_INDEX = {
  DRAWER: 1200,
  MODAL: 1300,
  SNACKBAR: 1400,
  TOOLTIP: 1500,
} as const;