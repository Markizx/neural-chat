// Re-export all shared types
export * from '@neuralchat/shared/types';

// Re-export web-specific types
export * from './api.types';
export * from './chat.types';

// Artifact type
export interface Artifact {
  id: string;
  type: 'code' | 'markdown' | 'react' | 'svg' | 'html' | 'mermaid';
  title?: string;
  content: string;
  language?: string;
  metadata?: Record<string, any>;
}

// Web-specific UI types
export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  createdAt: Date;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
  submenu?: ContextMenuItem[];
}

export interface KeyboardShortcut {
  key: string;
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  action: () => void;
  description: string;
  enabled?: boolean;
}

export interface DragDropFile {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface SearchResult<T = any> {
  items: T[];
  query: string;
  totalCount: number;
  page: number;
  pageSize: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface FormError {
  field: string;
  message: string;
  code?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortState<T = string> {
  field: T;
  order: 'asc' | 'desc';
}

export interface FilterState<T = any> {
  filters: T;
  activeCount: number;
  isActive: boolean;
}

export interface SelectionState<T = string> {
  selected: Set<T>;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
  onClose: () => void;
  onConfirm?: (data?: any) => void;
}

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error?: string;
  latency?: number;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncState<T> = 
  | { status: 'idle'; data?: undefined; error?: undefined }
  | { status: 'loading'; data?: T; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

export type ValueOf<T> = T[keyof T];

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];