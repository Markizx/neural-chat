// Re-export from shared types
// export * from '@neuralchat/shared/types/api.types';

// Local type definitions to avoid import issues
interface Chat {
  _id: string;
  userId: string;
  title: string;
  type: 'claude' | 'grok' | 'brainstorm';
  model: string;
  projectId?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  sharing: {
    isPublic: boolean;
    shareId?: string;
    sharedWith?: string[];
  };
  metadata: {
    messageCount: number;
    lastMessageAt?: string;
    totalTokens: number;
  };
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  attachments?: any[];
  artifacts?: any[];
  usage?: any;
  feedback?: any;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  subscription: any;
  usage: any;
  settings: any;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

interface BrainstormSession {
  _id: string;
  chatId: string;
  userId: string;
  topic: string;
  description?: string;
  participants: {
    claude: { model: string };
    grok: { model: string };
  };
  messages: Array<{
    id: string;
    speaker: 'claude' | 'grok' | 'user';
    content: string;
    timestamp: string;
  }>;
  status: 'active' | 'paused' | 'completed' | 'error';
  settings: {
    turnDuration: number;
    maxTurns: number;
    moderationLevel: 'low' | 'medium' | 'high';
    format: 'debate' | 'brainstorm' | 'analysis' | 'creative';
  };
  currentTurn: number;
  summary?: string;
  insights?: string[];
  duration?: number;
  totalTokens: number;
  createdAt: string;
  completedAt?: string;
}

interface Project {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  files: any[];
  collaborators: any[];
  settings: any;
  stats: any;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Subscription {
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  provider?: 'stripe' | 'apple' | 'google';
  customerId?: string;
  subscriptionId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

// Export local types for use in components
export type { Chat, Message, User, BrainstormSession, Project, Subscription };

// Additional service types
export interface CreateChatRequest {
  type: 'claude' | 'grok' | 'brainstorm';
  title: string;
  model?: string;
  projectId?: string;
}

export interface SendMessageRequest {
  content: string;
  attachments?: any[];
  replyTo?: string;
}

export interface StartBrainstormRequest {
  topic: string;
  description?: string;
  participants: {
    claude: { model: string };
    grok: { model: string };
  };
  settings: {
    turnDuration: number;
    maxTurns: number;
    moderationLevel: 'low' | 'medium' | 'high';
    format: 'debate' | 'brainstorm' | 'analysis' | 'creative';
  };
}

export interface BrainstormMessage {
  id: string;
  speaker: 'claude' | 'grok' | 'user';
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface BrainstormSummaryResponse {
  summary: string;
  insights: string[];
  duration: number;
  totalTokens: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color: string;
  icon: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isArchived?: boolean;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

// API Response wrapper types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// Specific API response types
export interface ChatResponse {
  chat: Chat;
}

export interface ChatsResponse {
  chats: Chat[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
}

export interface UserResponse {
  user: User;
}

export interface SettingsResponse {
  settings: User['settings'];
}

export interface BrainstormSessionResponse {
  session: BrainstormSession;
}

export interface ProjectsResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscriptionResponse {
  subscription: Subscription;
  stripeSubscription?: any;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface PortalResponse {
  portalUrl: string;
}

export interface StatsResponse {
  usage: {
    daily: {
      messages: number;
      limit: number;
    };
    total: {
      messages: number;
      chats: number;
    };
  };
}

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