import React, { useCallback, useState } from 'react';
import { Box, Typography, LinearProgress, IconButton, Paper } from '@mui/material';
import { CloudUpload, InsertDriveFile, Close, CheckCircle, Error } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onUpload?: (files: File[]) => void | Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const UploadArea = styled(Paper)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  '&.dragover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.light + '20',
  },
}));

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  multiple = false,
  maxSize,
  maxFiles = 5,
  onUpload,
  onError,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB limit`;
    }
    return null;
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      onError?.(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Check max files limit
    if (uploadedFiles.length + validFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Add files to upload queue
    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload (replace with actual upload logic)
    if (onUpload) {
      try {
        await onUpload(validFiles);
        
        // Update status to success
        setUploadedFiles((prev) =>
          prev.map((uf) =>
            validFiles.includes(uf.file)
              ? { ...uf, progress: 100, status: 'success' as const }
              : uf
          )
        );
      } catch (error) {
        // Update status to error
        setUploadedFiles((prev) =>
          prev.map((uf) =>
            validFiles.includes(uf.file)
              ? { ...uf, status: 'error' as const, error: 'Upload failed' }
              : uf
          )
        );
      }
    }
  }, [maxSize, maxFiles, uploadedFiles.length, onUpload, onError]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      
      <UploadArea
        className={isDragOver ? 'dragover' : ''}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        elevation={0}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drop files here or click to upload
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {accept && `Accepted formats: ${accept}`}
          {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
        </Typography>
      </UploadArea>

      {uploadedFiles.length > 0 && (
        <Box mt={2}>
          {uploadedFiles.map((uploadedFile, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
              variant="outlined"
            >
              <InsertDriveFile color="action" />
              
              <Box flex={1}>
                <Typography variant="body2" noWrap>
                  {uploadedFile.file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(uploadedFile.file.size)}
                </Typography>
                
                {uploadedFile.status === 'uploading' && (
                  <LinearProgress
                    variant="determinate"
                    value={uploadedFile.progress}
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              {uploadedFile.status === 'success' && <CheckCircle color="success" />}
              {uploadedFile.status === 'error' && (
                <Error color="error" titleAccess={uploadedFile.error} />
              )}
              
              <IconButton size="small" onClick={() => removeFile(index)}>
                <Close fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;