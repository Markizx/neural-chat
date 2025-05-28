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
  useMediaQuery,
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
  onSendMessage: (content: string, attachments?: any[]) => void;
  disabled?: boolean;
  projectId?: string;
  placeholder?: string;
  isMobile?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  projectId,
  placeholder = 'Введите сообщение...',
  isMobile = false,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setAttachments([...attachments, ...acceptedFiles]);
    },
    noClick: true,
    noKeyboard: true,
    disabled: isMobile, // Отключаем drag&drop на мобильных
  });

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (disabled || sending) return;

    setSending(true);
    try {
      await onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      // Error is already handled in useChat hook, just log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('MessageInput error:', error);
      }
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

  const dropzoneProps = isMobile ? {} : getRootProps();

  return (
    <Paper
      elevation={0}
      sx={{
        p: isMobile ? (isSmallMobile ? 1 : 1.5) : 2,
        borderTop: isMobile ? 0 : 1,
        borderColor: 'divider',
        borderRadius: isMobile ? '16px 16px 0 0' : 0,
        background: theme.palette.mode === 'dark' 
          ? alpha('#1a1a2e', 0.95)
          : alpha('#ffffff', 0.98),
        backdropFilter: 'blur(20px)',
        position: 'relative',
      }}
      {...dropzoneProps}
    >
      {!isMobile && <input {...getInputProps()} />}
      
      {isDragActive && !isMobile && (
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
        <Box sx={{ 
          mb: isMobile ? 1 : 2, 
          display: 'flex', 
          gap: 0.5, 
          flexWrap: 'wrap',
          maxHeight: isMobile ? '80px' : 'none',
          overflow: 'auto',
        }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              icon={getFileIcon(file)}
              label={file.name}
              onDelete={() => removeAttachment(index)}
              size={isMobile && isSmallMobile ? "small" : "small"}
              sx={{
                background: theme.palette.mode === 'dark'
                  ? alpha('#2a2a3e', 0.8)
                  : alpha(theme.palette.primary.main, 0.1),
                fontSize: isMobile && isSmallMobile ? '0.75rem' : undefined,
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

      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: isMobile ? 0.5 : 1,
        position: 'relative',
      }}>
        {/* Project indicator */}
        {projectId && !isMobile && (
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
          size={isMobile && isSmallMobile ? "small" : "medium"}
          sx={{
            color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.primary.main,
              background: alpha(theme.palette.primary.main, 0.1),
            },
            order: isMobile ? 1 : 0,
          }}
        >
          <AttachFile fontSize={isMobile && isSmallMobile ? "small" : "medium"} />
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
          maxRows={isMobile ? 3 : 4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled || sending}
          variant="outlined"
          size={isMobile && isSmallMobile ? "small" : "medium"}
          sx={{
            flex: 1,
            order: isMobile ? 0 : 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? '20px' : '12px',
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha('#2a2a3e', 0.6)
                : alpha('#f8fafc', 0.8),
              fontSize: isMobile && isSmallMobile ? '0.875rem' : undefined,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha('#2a2a3e', 0.8)
                  : alpha('#f8fafc', 1),
              },
              '&.Mui-focused': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? alpha('#2a2a3e', 1)
                  : '#ffffff',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 0 0 2px rgba(99, 102, 241, 0.3)'
                  : '0 0 0 2px rgba(99, 102, 241, 0.2)',
              },
            },
            '& .MuiOutlinedInput-input': {
              padding: isMobile ? (isSmallMobile ? '8px 12px' : '10px 14px') : '12px 16px',
            },
          }}
        />

        {/* Voice input (только на мобильных) */}
        {isMobile && (
          <IconButton
            disabled={disabled || sending}
            size={isSmallMobile ? "small" : "medium"}
            sx={{
              color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.primary.main,
                background: alpha(theme.palette.primary.main, 0.1),
              },
              order: 2,
            }}
          >
            <Mic fontSize={isSmallMobile ? "small" : "medium"} />
          </IconButton>
        )}

        {/* Send button */}
        <IconButton
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
          size={isMobile && isSmallMobile ? "small" : "medium"}
          sx={{
            background: message.trim() || attachments.length > 0
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : theme.palette.mode === 'dark' ? alpha('#2a2a3e', 0.6) : alpha('#e5e7eb', 0.8),
            color: message.trim() || attachments.length > 0 ? 'white' : theme.palette.text.disabled,
            ml: isMobile ? 0.5 : 1,
            order: isMobile ? 3 : 2,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: message.trim() || attachments.length > 0
                ? 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)'
                : theme.palette.mode === 'dark' ? alpha('#2a2a3e', 0.8) : alpha('#e5e7eb', 1),
              transform: message.trim() || attachments.length > 0 ? 'scale(1.05)' : 'none',
            },
            '&:disabled': {
              background: theme.palette.mode === 'dark' ? alpha('#2a2a3e', 0.4) : alpha('#e5e7eb', 0.6),
              color: theme.palette.text.disabled,
            },
          }}
        >
          {sending ? (
            <CircularProgress 
              size={isMobile && isSmallMobile ? 16 : 20} 
              sx={{ color: 'inherit' }} 
            />
          ) : (
            <Send fontSize={isMobile && isSmallMobile ? "small" : "medium"} />
          )}
        </IconButton>

        {/* Settings (только на десктопе) */}
        {!isMobile && (
          <>
            <IconButton
              onClick={handleSettingsClick}
              disabled={disabled || sending}
              sx={{
                color: theme.palette.mode === 'dark' ? '#6b7280' : theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  background: alpha(theme.palette.primary.main, 0.1),
                },
                order: 3,
              }}
            >
              <Settings />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleSettingsClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleSettingsClose}>
                <Settings fontSize="small" sx={{ mr: 1 }} />
                Настройки чата
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default MessageInput;