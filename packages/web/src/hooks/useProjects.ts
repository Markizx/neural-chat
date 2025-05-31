import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/project.service';

export interface Project {
  _id: string;
  name: string;
  description?: string;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
}

export const useProjects = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectService.getProjects();
      return response.projects;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await projectService.createProject({
        name: data.name,
        description: data.description,
        color: '#6366f1',
        icon: '📁'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      return await projectService.deleteProject(projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ projectId, files }: { projectId: string; files: File[] }) => {
      return await projectService.uploadFiles(projectId, files);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  return {
    projects: data || [],
    loading: isLoading,
    error: error?.message,
    refetch,
    createProject: createProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
    uploadFiles: uploadFilesMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
    isUploading: uploadFilesMutation.isPending,
  };
}; 