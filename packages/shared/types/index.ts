// Re-export all types
export * from './api.types';
export * from './brainstorm.types';
export * from './chat.types';
export * from './project.types';
export * from './subscription.types';
export * from './user.types';

// Common types
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
  platform: 'web' | 'ios' | 'android';
  requestId: string;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
} 