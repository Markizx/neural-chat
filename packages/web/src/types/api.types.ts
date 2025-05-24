// Re-export from shared types
export * from '@smartchat/shared/types/api.types';

// Additional web-specific API types
export interface FileUploadResponse {
  files: UploadedFile[];
  message: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface StreamingResponse {
  event: 'start' | 'chunk' | 'end' | 'error';
  data?: string;
  error?: string;
  metadata?: {
    model: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface WebSocketEvent<T = any> {
  event: string;
  data: T;
  timestamp: string;
  userId?: string;
  chatId?: string;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  publicUrl: string;
  fields: Record<string, string>;
  expiresAt: string;
}

export interface ExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'html';
  includeAttachments?: boolean;
  includeArtifacts?: boolean;
  includeMetadata?: boolean;
}

export interface ImportOptions {
  format: 'json' | 'markdown';
  createNewChat?: boolean;
  preserveTimestamps?: boolean;
}

export interface BatchOperation<T> {
  operations: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    data?: T;
  }>;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
    data?: T;
  }>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
  window: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    ai: {
      claude: 'up' | 'down';
      grok: 'up' | 'down';
    };
    storage: 'up' | 'down';
    email: 'up' | 'down';
  };
  uptime: number;
  timestamp: string;
}