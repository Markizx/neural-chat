import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Button,
} from '@mui/material';
import {
  InsertDriveFile,
  Delete,
  CloudUpload,
  Image,
  Code,
  Description,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { formatBytes } from '../../utils/helpers';

interface FileUploadProps {
  projectId: string;
  existingFiles: any[];
  onUpdate: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  projectId,
  existingFiles,
  onUpdate,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Upload files mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await apiService.upload(`/projects/${projectId}/files`, formData);
      return response.data;
    },
    onSuccess: () => {
      setUploading(false);
      setUploadProgress(0);
      onUpdate();
    },
    onError: (error: any) => {
      setUploading(false);
      setUploadProgress(0);
      setError(error.message || 'Upload failed');
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiService.delete(`/projects/${projectId}/files/${fileId}`);
    },
    onSuccess: () => {
      onUpdate();
    },
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      uploadMutation.mutate(acceptedFiles);
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image />;
    if (type.includes('code') || type.includes('javascript') || type.includes('python')) return <Code />;
    if (type.includes('pdf') || type.includes('document')) return <Description />;
    return <InsertDriveFile />;
  };

  const getFileTypeChip = (type: string) => {
    if (type.startsWith('image/')) return <Chip label="Image" size="small" color="primary" />;
    if (type.includes('code')) return <Chip label="Code" size="small" color="secondary" />;
    if (type.includes('pdf')) return <Chip label="PDF" size="small" color="info" />;
    return <Chip label="File" size="small" />;
  };

  return (
    <Box>
      {/* Upload area */}
      <Box
        {...getRootProps()}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          mb: 3,
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files (max 50MB)
        </Typography>
      </Box>

      {/* Upload progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Uploading...
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Files list */}
      {existingFiles.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom>
            Project Files ({existingFiles.length})
          </Typography>
          <List>
            {existingFiles.map((file) => (
              <ListItem
                key={file.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => {
                      if (window.confirm('Delete this file?')) {
                        deleteMutation.mutate(file.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Delete />
                  </IconButton>
                }
              >
                <ListItemIcon>{getFileIcon(file.type)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{file.name}</Typography>
                      {getFileTypeChip(file.type)}
                    </Box>
                  }
                  secondary={`${formatBytes(file.size)} • Uploaded ${new Date(
                    file.uploadedAt
                  ).toLocaleDateString()}`}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {existingFiles.length === 0 && !uploading && (
        <Typography variant="body2" color="text.secondary" align="center">
          No files uploaded yet
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;