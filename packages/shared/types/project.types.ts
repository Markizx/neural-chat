// packages/shared/types/project.types.ts

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
  role: CollaboratorRole;
  addedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface ProjectSettings {
  autoContext: boolean;
  contextLimit: number;
}

export interface ProjectStats {
  chatCount: number;
  fileCount: number;
  lastActivity?: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  settings?: Partial<ProjectSettings>;
}

export interface AddCollaboratorRequest {
  email: string;
  role: CollaboratorRole;
}

export interface ProjectListParams {
  archived?: boolean;
}

export interface ProjectFileUploadResponse {
  files: ProjectFile[];
  message: string;
}

export interface ProjectPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageCollaborators: boolean;
  canUploadFiles: boolean;
  canDeleteFiles: boolean;
}

export interface ProjectColors {
  BLUE: '#3B82F6';
  PURPLE: '#6366F1';
  GREEN: '#10B981';
  YELLOW: '#F59E0B';
  RED: '#EF4444';
  PINK: '#EC4899';
  INDIGO: '#6366F1';
  GRAY: '#6B7280';
}

export interface ProjectIcons {
  FOLDER: 'folder';
  BRIEFCASE: 'briefcase';
  BOOK: 'book';
  CODE: 'code';
  DOCUMENT: 'document';
  GLOBE: 'globe';
  HEART: 'heart';
  HOME: 'home';
  LIGHTBULB: 'lightbulb';
  ROCKET: 'rocket';
  STAR: 'star';
  TAG: 'tag';
}

export interface ProjectFileType {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  TEXT: ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'application/xml'];
  CODE: ['text/javascript', 'text/typescript', 'text/python', 'text/html', 'text/css'];
}

export interface ProjectContext {
  projectId: string;
  files: ProjectFile[];
  autoApply: boolean;
  contextString?: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  userId: string;
  action: ProjectAction;
  details?: Record<string, any>;
  timestamp: string;
}

export type ProjectAction = 
  | 'project.created'
  | 'project.updated'
  | 'project.archived'
  | 'project.restored'
  | 'file.uploaded'
  | 'file.deleted'
  | 'collaborator.added'
  | 'collaborator.removed'
  | 'collaborator.role_changed'
  | 'chat.created'
  | 'chat.deleted';

export interface ProjectExport {
  project: Project;
  chats: any[]; // Chat[]
  files: ProjectFile[];
  exportedAt: string;
}