import React, { useState, useRef, KeyboardEvent, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Chip,
  alpha,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Close,
  Image,
  InsertDriveFile,
  Stop,
  Folder,
  ExpandMore,
  ExpandLess,
  CloudUpload,
  PictureAsPdf,
  Code,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { Project } from '../../types/api.types';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[], projectFiles?: any[]) => void;
  disabled?: boolean;
  placeholder?: string;
  chatType?: string;
  isStreaming?: boolean;
  isMobile?: boolean;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  chatType,
  isStreaming = false,
  isMobile = false,
  selectedProjectId,
  onProjectSelect,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  const [projectFilesExpanded, setProjectFilesExpanded] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();

  // Получение списка проектов
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const response = await apiService.get('/projects');
      return response.data as Project[];
    },
  });

  // Получение файлов выбранного проекта
  const { data: selectedProject } = useQuery<Project | null>({
    queryKey: ['project', selectedProjectId],
    queryFn: async (): Promise<Project | null> => {
      if (!selectedProjectId) return null;
      const response = await apiService.get(`/projects/${selectedProjectId}`);
      return response.data as Project;
    },
    enabled: !!selectedProjectId,
  });

  // Обновление файлов проекта при изменении выбранного проекта
  useEffect(() => {
    if (selectedProject && selectedProject.files) {
      setProjectFiles(selectedProject.files);
    } else {
      setProjectFiles([]);
    }
  }, [selectedProject]);

  // Drag and drop для файлов
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles?.length > 0) {
      setError(`Некоторые файлы были отклонены. Максимальный размер: 50MB`);
      setTimeout(() => setError(null), 3000);
    }

    if (acceptedFiles?.length > 0) {
      setAttachments(prev => [...prev, ...acceptedFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    noClick: true,
    noKeyboard: true,
    accept: {
      'text/*': ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.xml', '.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    }
  });

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0 || projectFiles.length > 0) && !disabled && !isStreaming) {
      onSendMessage(message, attachments, projectFiles);
      setMessage('');
      setAttachments([]);
      setIsTyping(false);
      setError(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleProjectChange = (projectId: string) => {
    onProjectSelect?.(projectId);
  };

  const toggleProjectFiles = () => {
    setProjectFilesExpanded(prev => !prev);
  };

  const getFileIcon = (file: File | any) => {
    const type = file.type || file.fileType || '';
    const name = file.name?.toLowerCase() || '';

    if (type.startsWith('image/')) return <Image color="primary" />;
    if (type.includes('pdf')) return <PictureAsPdf color="error" />;
    if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return <Description color="info" />;
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css') || 
        name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.ts') || name.endsWith('.tsx') ||
        name.endsWith('.py') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.json')) {
      return <Code color="success" />;
    }
    return <InsertDriveFile color="action" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getGradient = () => {
    if (chatType === 'claude') {
      return 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)';
    }
    if (chatType === 'grok') {
      return 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)';
    }
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Выбор проекта */}
      {projects?.length > 0 && (
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <InputLabel>Проект (контекст)</InputLabel>
          <Select
            value={selectedProjectId || ''}
            onChange={(e) => handleProjectChange(e.target.value)}
            label="Проект (контекст)"
            disabled={disabled || isStreaming}
          >
            <MenuItem value="">
              <em>Без контекста проекта</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Folder fontSize="small" />
                  {project.name}
                  {project.files?.length > 0 && (
                    <Chip 
                      label={`${project.files.length} файлов`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Файлы проекта */}
      {projectFiles.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 2, mb: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'success.main',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: projectFilesExpanded ? 1 : 0
            }}
            onClick={toggleProjectFiles}
          >
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
              📁 Файлы проекта будут переданы как контекст ({projectFiles.length})
            </Typography>
            <IconButton size="small" color="success">
              {projectFilesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
          
          <Collapse in={projectFilesExpanded}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {projectFiles.map((file, index) => (
                <Chip
                  key={file._id || index}
                  icon={getFileIcon(file)}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{file.name}</span>
                      <Typography variant="caption" color="text.secondary">
                        ({formatFileSize(file.size)})
                      </Typography>
                    </Box>
                  }
                  variant="outlined"
                  color="success"
                  size="small"
                  sx={{ maxWidth: 250 }}
                />
              ))}
            </Box>
          </Collapse>
        </Paper>
      )}

      {/* Ошибки */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Drag and Drop область */}
      <Box 
        {...getRootProps()}
        sx={{ 
          position: 'relative',
          borderRadius: 2,
          border: isDragActive ? '2px dashed' : 'none',
          borderColor: isDragActive ? 'primary.main' : 'transparent',
          bgcolor: isDragActive ? 'action.hover' : 'transparent',
          transition: 'all 0.2s ease',
        }}
      >
        <input {...getInputProps()} />
        
        {isDragActive && (
          <Box sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 2,
            zIndex: 10,
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" color="primary">
                Перетащите файлы сюда
              </Typography>
            </Box>
          </Box>
        )}

        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  📎 Прикрепленные файлы ({attachments.length}):
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {attachments.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Chip
                        icon={getFileIcon(file)}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{file.name}</span>
                            <Typography variant="caption" color="text.secondary">
                              ({formatFileSize(file.size)})
                            </Typography>
                          </Box>
                        }
                        onDelete={() => removeAttachment(index)}
                        deleteIcon={<Close />}
                        sx={{
                          background: alpha(theme.palette.primary.main, 0.1),
                          borderColor: theme.palette.primary.main,
                          maxWidth: 250,
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.error.main,
                            '&:hover': {
                              color: theme.palette.error.dark,
                            },
                          },
                        }}
                      />
                    </motion.div>
                  ))}
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            p: isMobile ? 1.5 : 2,
            borderRadius: '25px',
            border: 1,
            borderColor: isTyping 
              ? theme.palette.primary.main 
              : alpha(theme.palette.divider, 0.5),
            background: theme.palette.mode === 'dark'
              ? alpha('#1a1a2e', 0.6)
              : alpha('#ffffff', 0.9),
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: isTyping ? getGradient() : 'transparent',
              transition: 'all 0.3s ease',
            },
          }}
        >
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/*,application/pdf,text/*,.md,.txt,.csv,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.doc,.docx"
          />

          {/* Attach Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Tooltip title="Прикрепить файл">
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isStreaming}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
              >
                <AttachFile />
              </IconButton>
            </Tooltip>
          </motion.div>

          {/* Text Field */}
          <TextField
            inputRef={textFieldRef}
            fullWidth
            multiline
            maxRows={6}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? 'Waiting for response...' : placeholder}
            disabled={disabled || isStreaming}
            variant="standard"
            InputProps={{
              disableUnderline: true,
            }}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: '0.95rem',
                lineHeight: 1.5,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.7,
                },
              },
            }}
          />

          {/* Send/Stop Button */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <IconButton
              onClick={isStreaming ? undefined : handleSend}
              disabled={(!message.trim() && attachments.length === 0 && projectFiles.length === 0) || disabled}
              sx={{
                background: isStreaming 
                  ? theme.palette.error.main
                  : (message.trim() || attachments.length > 0 || projectFiles.length > 0)
                  ? getGradient()
                  : 'transparent',
                color: (message.trim() || attachments.length > 0 || projectFiles.length > 0) || isStreaming
                  ? 'white'
                  : theme.palette.text.secondary,
                '&:hover': {
                  background: isStreaming
                    ? theme.palette.error.dark
                    : (message.trim() || attachments.length > 0 || projectFiles.length > 0)
                    ? getGradient()
                    : alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.05)',
                },
                '&:disabled': {
                  background: 'transparent',
                  color: theme.palette.text.disabled,
                },
                transition: 'all 0.3s ease',
              }}
            >
              {isStreaming ? <Stop /> : <Send />}
            </IconButton>
          </motion.div>
        </Paper>

        {/* Status info */}
        <AnimatePresence>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Enter - отправить, Shift+Enter - новая строка
            </Typography>
            {projectFiles.length > 0 && (
              <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                📁 {projectFiles.length} файлов проекта как контекст
              </Typography>
            )}
          </Box>
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default MessageInput;