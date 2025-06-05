import React, { useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Chip,
  Typography,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  AttachFile,
  Close,
  InsertDriveFile,
  Image,
  PictureAsPdf,
  Description,
  Code,
} from '@mui/icons-material';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files?: File[]; // Для синхронизации состояния
  maxFiles?: number;
  maxFileSize?: number; // в MB
  acceptedTypes?: string[];
  acceptedFileTypes?: string[]; // Алиас для acceptedTypes
  disabled?: boolean;
  helperText?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  error?: string;
}

const FileUpload = React.forwardRef<any, FileUploadProps>(({
  onFilesChange,
  files = [],
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
    '.md',
    '.txt',
    '.csv',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.java',
    '.cpp',
    '.c',
    '.html',
    '.css',
  ],
  acceptedFileTypes,
  disabled = false,
  helperText,
}, ref) => {
  // Используем acceptedFileTypes если предоставлено, иначе acceptedTypes
  const finalAcceptedTypes = acceptedFileTypes || acceptedTypes;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Синхронизация с внешним состоянием files
  React.useEffect(() => {
    if (files.length === 0 && uploadedFiles.length > 0) {
      // Очищаем внутреннее состояние когда внешние файлы очищены
      setUploadedFiles([]);
    }
  }, [files.length, uploadedFiles.length]);

  // Предоставляем метод для очистки файлов
  React.useImperativeHandle(ref, () => ({
    clearFiles: () => {
      setUploadedFiles([]);
      onFilesChange([]);
    }
  }));

  const getFileIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();

    if (type.startsWith('image/')) return <Image />;
    if (type === 'application/pdf') return <PictureAsPdf />;
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return <Description />;
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.tsx') || 
        name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.cpp') || name.endsWith('.c') ||
        name.endsWith('.html') || name.endsWith('.css')) return <Code />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Файл слишком большой. Максимальный размер: ${maxFileSize}MB`;
    }

    const isAccepted = finalAcceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      }
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'Неподдерживаемый тип файла';
    }

    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles: UploadedFile[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        return;
      }

      const error = validateFile(file);
      const uploadedFile: UploadedFile = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: error ? 0 : 100,
        error,
      };

      newFiles.push(uploadedFile);
      if (!error) {
        validFiles.push(file);
      }
    });

    setUploadedFiles(prev => {
      const updated = [...prev, ...newFiles];
      // Передаем только валидные файлы
      const allValidFiles = updated.filter(f => !f.error).map(f => f.file);
      onFilesChange(allValidFiles);
      return updated;
    });
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      const validFiles = updated.filter(f => !f.error).map(f => f.file);
      onFilesChange(validFiles);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <Box>
      {/* Кнопка загрузки */}
      <Tooltip title="Прикрепить файл">
        <IconButton
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadedFiles.length >= maxFiles}
          size="small"
        >
          <AttachFile />
        </IconButton>
      </Tooltip>

      {/* Скрытый input для файлов */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={finalAcceptedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Область перетаскивания */}
      {uploadedFiles.length === 0 && (
        <Paper
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            p: 2,
            mt: 1,
            border: `2px dashed ${dragOver ? 'primary.main' : 'divider'}`,
            backgroundColor: dragOver ? 'action.hover' : 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            display: dragOver ? 'block' : 'none',
          }}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Перетащите файлы сюда или нажмите для выбора
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
            Максимум {maxFiles} файлов, до {maxFileSize}MB каждый
          </Typography>
        </Paper>
      )}

      {/* Список загруженных файлов */}
      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 1, maxHeight: '120px', overflow: 'auto' }}>
          {uploadedFiles.map((uploadedFile) => (
            <Chip
              key={uploadedFile.id}
              icon={getFileIcon(uploadedFile.file)}
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="caption" noWrap sx={{ maxWidth: '150px' }}>
                    {uploadedFile.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(uploadedFile.file.size)}
                  </Typography>
                  {uploadedFile.error && (
                    <Typography variant="caption" color="error.main">
                      {uploadedFile.error}
                    </Typography>
                  )}
                </Box>
              }
              onDelete={() => handleRemoveFile(uploadedFile.id)}
              deleteIcon={<Close />}
              variant={uploadedFile.error ? "outlined" : "filled"}
              color={uploadedFile.error ? "error" : "default"}
              sx={{
                mb: 0.5,
                mr: 0.5,
                maxWidth: '200px',
                height: 'auto',
                '& .MuiChip-label': {
                  py: 1,
                },
              }}
            />
          ))}
        </Box>
      )}

      {/* Информация о лимитах */}
      {uploadedFiles.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {uploadedFiles.length} из {maxFiles} файлов
        </Typography>
      )}

      {/* Helper text */}
      {helperText && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            mt: 1, 
            fontSize: '0.7rem',
            lineHeight: 1.2,
            maxWidth: '400px'
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
});

export default FileUpload; 