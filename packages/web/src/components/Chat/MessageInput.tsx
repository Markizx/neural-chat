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
} from '@mui/material';
import {
  Send,
  AttachFile,
  Settings,
  Folder,
  Close,
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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        borderRadius: 0,
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
            bgcolor: 'primary.main',
            opacity: 0.1,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography>Drop files here</Typography>
        </Box>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => removeAttachment(index)}
              size="small"
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* Project indicator */}
        {projectId && (
          <Tooltip title="Project context active">
            <Folder color="primary" />
          </Tooltip>
        )}

        {/* File upload */}
        <IconButton
          component="label"
          disabled={disabled || sending}
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
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || sending}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />

        {/* Settings */}
        <IconButton onClick={handleSettingsClick} disabled={disabled || sending}>
          <Settings />
        </IconButton>

        {/* Send button */}
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
          endIcon={sending ? <CircularProgress size={20} /> : <Send />}
          sx={{
            borderRadius: 3,
            px: 3,
          }}
        >
          Send
        </Button>
      </Box>

      {/* Settings menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem onClick={handleSettingsClose}>
          Model Settings
        </MenuItem>
        <MenuItem onClick={handleSettingsClose}>
          System Prompt
        </MenuItem>
        <MenuItem onClick={handleSettingsClose}>
          Parameters
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default MessageInput;