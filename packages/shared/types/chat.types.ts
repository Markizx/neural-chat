// packages/shared/types/chat.types.ts

export interface Chat {
  _id: string;
  userId: string;
  title: string;
  type: ChatType;
  model: string;
  projectId?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  sharing: ChatSharing;
  metadata: ChatMetadata;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export type ChatType = 'claude' | 'grok' | 'brainstorm';

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
  role: MessageRole;
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

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: AttachmentType;
  size: number;
  mimeType: string;
}

export type AttachmentType = 'image' | 'document' | 'code' | 'other';

export interface Artifact {
  id: string;
  type: ArtifactType;
  title?: string;
  content: string;
  language?: string;
  metadata?: Record<string, any>;
}

export type ArtifactType = 'code' | 'markdown' | 'react' | 'svg' | 'html' | 'mermaid';

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

export interface CreateChatRequest {
  type: ChatType;
  model: string;
  title?: string;
  projectId?: string;
}

export interface UpdateChatRequest {
  title?: string;
  tags?: string[];
  projectId?: string;
}

export interface SendMessageRequest {
  content: string;
  attachments?: Attachment[];
}

export interface ChatSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  type?: ChatType;
  projectId?: string;
  isArchived?: boolean;
}

export interface ChatListResponse {
  chats: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export interface MessageListResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}