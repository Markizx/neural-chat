// Re-export from shared types
export * from '@smartchat/shared/types/chat.types';

// Message type for web
export interface Message {
  _id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    mimeType: string;
  }>;
  artifacts?: Array<{
    id: string;
    type: string;
    title?: string;
    content: string;
    language?: string;
    metadata?: any;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
  };
  feedback?: {
    rating?: number;
    comment?: string;
    ratedAt?: string;
  };
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Chat type for web
export interface Chat {
  _id: string;
  userId: string;
  title: string;
  type: 'claude' | 'grok' | 'brainstorm';
  model: string;
  projectId?: string;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  sharing?: {
    isPublic?: boolean;
    shareId?: string;
    sharedWith?: string[];
  };
  metadata: {
    messageCount: number;
    lastMessageAt?: string;
    totalTokens?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Additional web-specific chat types
export interface ChatDraft {
  id: string;
  type: 'claude' | 'grok';
  model: string;
  title: string;
  content: string;
  attachments: File[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDraft {
  chatId: string;
  content: string;
  attachments: File[];
  replyTo?: string;
}

export interface StreamingMessage {
  id: string;
  content: string;
  isStreaming: boolean;
  chunks: string[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ChatPreferences {
  defaultModel: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
}

export interface ChatFilter {
  type?: 'claude' | 'grok' | 'brainstorm';
  models?: string[];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasAttachments?: boolean;
  hasArtifacts?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  searchQuery?: string;
}

export interface ChatSort {
  field: 'createdAt' | 'updatedAt' | 'title' | 'messageCount';
  order: 'asc' | 'desc';
}

export interface ChatStatistics {
  totalChats: number;
  totalMessages: number;
  totalTokens: number;
  averageMessagesPerChat: number;
  mostUsedModel: string;
  chatsByType: {
    claude: number;
    grok: number;
    brainstorm: number;
  };
  chatsByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  type: 'like' | 'dislike' | 'love' | 'wow' | 'haha' | 'sad' | 'angry';
  createdAt: string;
}

export interface MessageThread {
  parentId: string;
  replies: Message[];
  replyCount: number;
  participants: string[];
  lastReplyAt: string;
}

export interface ChatTemplate {
  id: string;
  name: string;
  description: string;
  type: 'claude' | 'grok';
  model: string;
  systemPrompt: string;
  initialMessage?: string;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: string;
}

export interface ChatExport {
  chat: Chat;
  messages: Message[];
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    size: number;
  }>;
  artifacts: Artifact[];
  exportedAt: string;
  version: string;
}