// Re-export all types
export * from './chat.types';
export * from './user.types';
export * from './api.types';
export * from './subscription.types';
export * from './project.types';
export * from './brainstorm.types';

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

export interface User {
  _id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  subscription: Subscription;
  usage: Usage;
  settings: UserSettings;
  status: 'active' | 'suspended' | 'deleted';
  metadata: UserMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
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

export interface Usage {
  dailyMessages: number;
  resetDate?: string;
  totalMessages: number;
  totalTokens: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultModel: string;
  fontSize: number;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  chatMessages: boolean;
  brainstormUpdates: boolean;
  marketing: boolean;
}

export interface UserMetadata {
  lastLogin?: string;
  lastActivity?: string;
  loginCount: number;
  referralCode?: string;
  referredBy?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface Chat {
  _id: string;
  userId: string;
  title: string;
  type: 'claude' | 'grok' | 'brainstorm';
  model: string;
  projectId?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  sharing: ChatSharing;
  metadata: ChatMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSharing {
  isPublic: boolean;
  shareId?: string;
  sharedWith?: string[];
}

export interface ChatMetadata {
  messageCount: number;
  lastMessageAt?: string;
  totalTokens: number;
}

export interface Message {
  _id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  attachments?: Attachment[];
  artifacts?: Artifact[];
  usage?: MessageUsage;
  feedback?: MessageFeedback;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'code' | 'other';
  size: number;
  mimeType: string;
}

export interface Artifact {
  id: string;
  type: 'code' | 'markdown' | 'react' | 'svg' | 'html' | 'mermaid';
  title?: string;
  content: string;
  language?: string;
  metadata?: any;
}

export interface MessageUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface MessageFeedback {
  rating: number;
  comment?: string;
  ratedAt: string;
}

export interface Project {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  files: ProjectFile[];
  collaborators: Collaborator[];
  settings: ProjectSettings;
  stats: ProjectStats;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface Collaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  addedAt: string;
}

export interface ProjectSettings {
  autoContext: boolean;
  contextLimit: number;
}

export interface ProjectStats {
  chatCount: number;
  fileCount: number;
  lastActivity?: string;
}

export interface BrainstormSession {
  _id: string;
  chatId: string;
  userId: string;
  topic: string;
  description?: string;
  participants: BrainstormParticipants;
  messages: BrainstormMessage[];
  status: 'active' | 'paused' | 'completed' | 'error';
  settings: BrainstormSettings;
  summary?: string;
  insights?: string[];
  duration?: number;
  totalTokens: number;
  createdAt: string;
  completedAt?: string;
}

export interface BrainstormParticipants {
  claude: {
    model: string;
    systemPrompt?: string;
  };
  grok: {
    model: string;
    systemPrompt?: string;
  };
}

export interface BrainstormMessage {
  id: string;
  speaker: 'claude' | 'grok' | 'user';
  content: string;
  timestamp: string;
  tokens?: number;
}

export interface BrainstormSettings {
  turnDuration: number;
  maxTurns: number;
  moderationLevel: 'low' | 'medium' | 'high';
  format: 'debate' | 'brainstorm' | 'analysis' | 'creative';
}