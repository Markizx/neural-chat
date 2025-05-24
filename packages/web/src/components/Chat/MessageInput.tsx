import React, { useState, useRef, KeyboardEvent } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Settings,
  Folder,
  Close,
  Image,
  Description,
  Mic,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface MessageInputProps {
  onSend: (content: string, attachments?: any[]) => void;
  disabled?: boolean;
  projectId?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  disabled = false,
  projectId,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachments([...attachments, ...acceptedFiles]);
    },
    noClick: true,
    noKeyboard: true,
  });

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || sending) return;

    setSending(true);
    try {
      await onSend(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image fontSize="small" />;
    return <Description fontSize="small" />;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
        background: theme.palette.mode === 'dark' 
          ? alpha('#1a1a2e', 0.8)
          : alpha('#ffffff', 0.95),
        backdropFilter: 'blur(10px)',
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      
      {isDragActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            backdropFilter: 'blur(5px)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            border: `2px dashed ${theme.palette.primary.main}`,
          }}
        >
          <Typography variant="h6" color="primary">
            Перетащите файлы сюда
          </Typography>
        </Box>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              icon={getFileIcon(file)}
              label={file.name}
              onDelete={() => removeAttachment(index)}
              size="small"
              sx={{
                background: theme.palette.mode === 'dark'
                  ? alpha('#2a2a3e', 0.8)
                  : alpha(theme.palette.primary.main, 0.1),
                '& .MuiChip-deleteIcon': {
                  color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
                  '&:hover': {
                    color: theme.palette.error.main,
                  },
                },
              }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* Project indicator */}
        {projectId && (
          <Tooltip title="Контекст проекта активен">
            <Folder 
              sx={{ 
                color: theme.palette.primary.main,
                filter: theme.palette.mode === 'dark' ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' : 'none',
              }} 
            />
          </Tooltip>
        )}

        {/* File upload */}
        <IconButton
          component="label"
          disabled={disabled || sending}
          sx={{
            color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
              background: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <AttachFile />
          <input
            type="file"
            hidden
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setAttachments([...attachments, ...Array.from(e.target.files)]);
              }
            }}
          />
        </IconButton>

        {/* Message input */}
        <TextField
          ref={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Напишите сообщение..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || sending}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '30px',
              background: theme.palette.mode === 'dark'
                ? alpha('#1a1a2e', 0.5)
                : alpha('#f3f4f6', 0.8),
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? alpha('#6366f1', 0.2)
                : alpha(theme.palette.divider, 0.5)}`,
              transition: 'all 0.2s',
              '& fieldset': {
                border: 'none',
              },
              '&:hover': {
                borderColor: alpha(theme.palette.primary.main, 0.5),
                background: theme.palette.mode === 'dark'
                  ? alpha('#1a1a2e', 0.7)
                  : alpha('#f3f4f6', 1),
              },
              '&.Mui-focused': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                background: theme.palette.mode === 'dark'
                  ? alpha('#1a1a2e', 0.8)
                  : '#ffffff',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              padding: '12px 20px',
              '&::placeholder': {
                color: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af',
                opacity: 1,
              },
            },
          }}
        />

        {/* Voice input */}
        <IconButton
          disabled={disabled || sending}
          sx={{
            color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
              background: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <Mic />
        </IconButton>

        {/* Settings */}
        <IconButton 
          onClick={handleSettingsClick} 
          disabled={disabled || sending}
          sx={{
            color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
              background: alpha(theme.palette.primary.main, 0.1),
            },
          }}
        >
          <Settings />
        </IconButton>

        {/* Send button */}
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
          endIcon={sending ? <CircularProgress size={20} /> : <Send />}
          sx={{
            borderRadius: '25px',
            px: 3,
            minWidth: 'auto',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 16px rgba(124, 58, 237, 0.3)'
              : '0 4px 16px rgba(102, 126, 234, 0.25)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #6d28d9 0%, #db2777 100%)'
                : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(124, 58, 237, 0.4)'
                : '0 8px 24px rgba(102, 126, 234, 0.35)',
            },
            '&:disabled': {
              background: theme.palette.action.disabledBackground,
              boxShadow: 'none',
            },
          }}
        >
          {!sending && 'Отправить'}
        </Button>
      </Box>

      {/* Settings menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark'
              ? alpha('#1e1e2e', 0.95)
              : alpha('#ffffff', 0.98),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 4px 16px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <MenuItem onClick={handleSettingsClose}>Настройки модели</MenuItem>
        <MenuItem onClick={handleSettingsClose}>Системный промпт</MenuItem>
        <MenuItem onClick={handleSettingsClose}>Параметры</MenuItem>
      </Menu>
    </Paper>
  );
};

export default MessageInput;