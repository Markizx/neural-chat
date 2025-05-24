// Re-export from shared types
export * from '@smartchat/shared/types/chat.types';

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