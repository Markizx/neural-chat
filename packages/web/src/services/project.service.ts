import { apiService } from './api.service';
import { Project, CreateProjectRequest, UpdateProjectRequest, ProjectFile } from '../types';

interface ProjectsResponse {
  projects: Project[];
  total: number;
}

interface ProjectResponse {
  project: Project;
}

interface FilesResponse {
  files: ProjectFile[];
}

class ProjectService {
  // Get all projects
  async getProjects(params?: { archived?: boolean }): Promise<ProjectsResponse> {
    const response = await apiService.get<ProjectsResponse>('/projects', params);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get projects');
    }
    return response.data!;
  }

  // Get single project
  async getProject(projectId: string): Promise<Project> {
    const response = await apiService.get<ProjectResponse>(`/projects/${projectId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get project');
    }
    return response.data!.project;
  }

  // Create project
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await apiService.post<ProjectResponse>('/projects', data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create project');
    }
    return response.data!.project;
  }

  // Update project
  async updateProject(projectId: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiService.put<ProjectResponse>(`/projects/${projectId}`, data);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update project');
    }
    return response.data!.project;
  }

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    const response = await apiService.delete(`/projects/${projectId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete project');
    }
  }

  // Archive/Unarchive project
  async archiveProject(projectId: string, archive: boolean = true): Promise<Project> {
    const response = await apiService.put<ProjectResponse>(`/projects/${projectId}`, {
      isArchived: archive,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to archive project');
    }
    return response.data!.project;
  }

  // Upload files to project
  async uploadFiles(projectId: string, files: File[]): Promise<ProjectFile[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiService.upload<FilesResponse>(
      `/projects/${projectId}/files`,
      formData
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to upload files');
    }
    return response.data!.files;
  }

  // Delete file from project
  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const response = await apiService.delete(`/projects/${projectId}/files/${fileId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete file');
    }
  }

  // Add collaborator
  async addCollaborator(
    projectId: string,
    email: string,
    role: 'owner' | 'editor' | 'viewer'
  ): Promise<void> {
    const response = await apiService.post(`/projects/${projectId}/collaborators`, {
      email,
      role,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to add collaborator');
    }
  }

  // Update collaborator role
  async updateCollaboratorRole(
    projectId: string,
    userId: string,
    role: 'owner' | 'editor' | 'viewer'
  ): Promise<void> {
    const response = await apiService.put(`/projects/${projectId}/collaborators/${userId}`, {
      role,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update collaborator role');
    }
  }

  // Remove collaborator
  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const response = await apiService.delete(`/projects/${projectId}/collaborators/${userId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to remove collaborator');
    }
  }

  // Get project statistics
  async getProjectStats(projectId: string): Promise<any> {
    const response = await apiService.get(`/projects/${projectId}/stats`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get project stats');
    }
    return response.data;
  }

  // Export project
  async exportProject(projectId: string): Promise<Blob> {
    const response = await apiService.get(`/projects/${projectId}/export`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to export project');
    }
    
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: 'application/json',
    });
    return blob;
  }

  // Clone project
  async cloneProject(projectId: string, name: string): Promise<Project> {
    const response = await apiService.post<ProjectResponse>(`/projects/${projectId}/clone`, {
      name,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to clone project');
    }
    return response.data!.project;
  }
}

export const projectService = new ProjectService();