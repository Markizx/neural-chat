// packages/shared/types/api.types.ts

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata: ApiMetadata;
  pagination?: ApiPagination;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMetadata {
  timestamp: string;
  version: string;
  platform: Platform;
  requestId: string;
}

export type Platform = 'web' | 'ios' | 'android';

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: any; // Will be User type from user.types.ts
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface WebSocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: string;
}

export interface WebSocketAuth {
  token: string;
}

export interface ErrorCode {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED';
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS';
  TOKEN_EXPIRED: 'TOKEN_EXPIRED';
  INVALID_TOKEN: 'INVALID_TOKEN';
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR';
  INVALID_INPUT: 'INVALID_INPUT';
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD';
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND';
  ALREADY_EXISTS: 'ALREADY_EXISTS';
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN';
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS';
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED';
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED';
  
  // Payment errors
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED';
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED';
  PAYMENT_FAILED: 'PAYMENT_FAILED';
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR';
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE';
  
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE';
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE';
  UPLOAD_FAILED: 'UPLOAD_FAILED';
}

export interface ApiEndpoints {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register';
  AUTH_LOGIN: '/api/v1/auth/login';
  AUTH_LOGOUT: '/api/v1/auth/logout';
  AUTH_REFRESH: '/api/v1/auth/refresh';
  AUTH_VERIFY_EMAIL: '/api/v1/auth/verify-email/:token';
  AUTH_FORGOT_PASSWORD: '/api/v1/auth/forgot-password';
  AUTH_RESET_PASSWORD: '/api/v1/auth/reset-password';
  AUTH_GOOGLE: '/api/v1/auth/google';
  AUTH_APPLE: '/api/v1/auth/apple';
  
  // User
  USER_PROFILE: '/api/v1/user/profile';
  USER_SETTINGS: '/api/v1/user/settings';
  USER_AVATAR: '/api/v1/user/avatar';
  USER_USAGE: '/api/v1/user/usage';
  USER_SUBSCRIPTION: '/api/v1/user/subscription';
  USER_INVOICES: '/api/v1/user/invoices';
  USER_EXPORT: '/api/v1/user/export-data';
  
  // Chats
  CHATS: '/api/v1/chats';
  CHAT_BY_ID: '/api/v1/chats/:id';
  CHAT_SEARCH: '/api/v1/chats/search';
  CHAT_SHARED: '/api/v1/chats/shared/:shareId';
  CHAT_ARCHIVE: '/api/v1/chats/:id/archive';
  CHAT_PIN: '/api/v1/chats/:id/pin';
  CHAT_SHARE: '/api/v1/chats/:id/share';
  
  // Messages
  MESSAGES: '/api/v1/chats/:chatId/messages';
  MESSAGE_BY_ID: '/api/v1/messages/:id';
  MESSAGE_FEEDBACK: '/api/v1/messages/:id/feedback';
  MESSAGE_REGENERATE: '/api/v1/messages/:id/regenerate';
  
  // Projects
  PROJECTS: '/api/v1/projects';
  PROJECT_BY_ID: '/api/v1/projects/:id';
  PROJECT_FILES: '/api/v1/projects/:id/files';
  PROJECT_FILE: '/api/v1/projects/:id/files/:fileId';
  PROJECT_COLLABORATORS: '/api/v1/projects/:id/collaborators';
  PROJECT_COLLABORATOR: '/api/v1/projects/:id/collaborators/:userId';
  
  // Brainstorm
  BRAINSTORM_START: '/api/v1/brainstorm/start';
  BRAINSTORM_SESSION: '/api/v1/brainstorm/:id';
  BRAINSTORM_MESSAGE: '/api/v1/brainstorm/:id/message';
  BRAINSTORM_PAUSE: '/api/v1/brainstorm/:id/pause';
  BRAINSTORM_RESUME: '/api/v1/brainstorm/:id/resume';
  BRAINSTORM_STOP: '/api/v1/brainstorm/:id/stop';
  BRAINSTORM_SUMMARY: '/api/v1/brainstorm/:id/summary';
  BRAINSTORM_EXPORT: '/api/v1/brainstorm/:id/export';
  
  // Files
  FILE_UPLOAD: '/api/v1/files/upload';
  FILE_UPLOAD_URL: '/api/v1/files/upload-url';
  FILE_GET: '/api/v1/files/:id';
  FILE_DELETE: '/api/v1/files/:id';
  FILE_DOWNLOAD: '/api/v1/files/:id/download';
  FILE_PROCESS: '/api/v1/files/process';
  
  // Subscription
  SUBSCRIPTION_PLANS: '/api/v1/subscription/plans';
  SUBSCRIPTION_CHECKOUT: '/api/v1/subscription/create-checkout';
  SUBSCRIPTION_PORTAL: '/api/v1/subscription/create-portal';
  SUBSCRIPTION_CANCEL: '/api/v1/subscription/cancel';
  SUBSCRIPTION_RESUME: '/api/v1/subscription/resume';
  SUBSCRIPTION_CHANGE: '/api/v1/subscription/change-plan';
  SUBSCRIPTION_STATUS: '/api/v1/subscription/status';
}

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  withCredentials?: boolean;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}