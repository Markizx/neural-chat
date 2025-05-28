// packages/shared/types/brainstorm.types.ts

export interface BrainstormSession {
  _id: string;
  chatId: string;
  userId: string;
  topic: string;
  description?: string;
  participants: BrainstormParticipants;
  messages: BrainstormMessage[];
  status: BrainstormStatus;
  settings: BrainstormSettings;
  summary?: string;
  insights?: string[];
  duration?: number;
  totalTokens: number;
  currentTurn?: number;
  isFinished?: boolean;
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
  speaker: BrainstormSpeaker;
  content: string;
  timestamp: string;
  tokens?: number;
}

export type BrainstormSpeaker = 'claude' | 'grok' | 'user';
export type BrainstormStatus = 'active' | 'paused' | 'completed' | 'error';
export type BrainstormFormat = 'debate' | 'brainstorm' | 'analysis' | 'creative';

export interface BrainstormSettings {
  turnDuration: number; // seconds
  maxTurns: number;
  moderationLevel: 'low' | 'medium' | 'high';
  format: BrainstormFormat;
}

export interface StartBrainstormRequest {
  topic: string;
  description?: string;
  claudeModel?: string;
  grokModel?: string;
  settings?: Partial<BrainstormSettings>;
}

export interface StartBrainstormResponse {
  chat: any; // Chat type
  session: BrainstormSession;
}

export interface BrainstormMessageRequest {
  content: string;
}

export interface BrainstormMessageResponse {
  userMessage: BrainstormMessage;
  nextMessages: BrainstormMessage[];
  session: BrainstormSession;
}

export interface BrainstormSummaryResponse {
  summary: string;
  insights: string[];
  stats: BrainstormStats;
}

export interface BrainstormStats {
  duration: number;
  totalMessages: number;
  totalTokens: number;
  claudeMessages: number;
  grokMessages: number;
}

export interface BrainstormExportFormat {
  JSON: 'json';
  MARKDOWN: 'markdown';
}

export interface BrainstormExportData {
  topic: string;
  description?: string;
  participants: BrainstormParticipants;
  messages: Array<{
    speaker: string;
    content: string;
    timestamp: string;
  }>;
  status: BrainstormStatus;
  settings: BrainstormSettings;
  summary?: string;
  insights?: string[];
  duration?: number;
  totalTokens: number;
  createdAt: string;
  completedAt?: string;
}

export interface BrainstormPrompts {
  brainstorm: {
    claude: string;
    grok: string;
  };
  debate: {
    claude: string;
    grok: string;
  };
  analysis: {
    claude: string;
    grok: string;
  };
  creative: {
    claude: string;
    grok: string;
  };
}

export interface BrainstormWebSocketEvents {
  JOIN: 'brainstorm:join';
  LEAVE: 'brainstorm:leave';
  JOINED: 'brainstorm:joined';
  MESSAGE: 'brainstorm:message';
  STATUS_CHANGED: 'brainstorm:status-changed';
  ERROR: 'brainstorm:error';
}

export interface BrainstormLimits {
  MIN_TURNS: 5;
  MAX_TURNS: 50;
  MIN_TURN_DURATION: 30;
  MAX_TURN_DURATION: 120;
}

export interface BrainstormFormatConfig {
  brainstorm: {
    name: 'Brainstorming';
    description: 'Creative ideation and solution finding';
    icon: 'lightbulb';
  };
  debate: {
    name: 'Debate';
    description: 'Structured argumentation on opposing viewpoints';
    icon: 'balance';
  };
  analysis: {
    name: 'Analysis';
    description: 'Systematic examination of complex topics';
    icon: 'chart';
  };
  creative: {
    name: 'Creative';
    description: 'Imaginative exploration and artistic expression';
    icon: 'palette';
  };
}