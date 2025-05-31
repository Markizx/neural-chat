import React, { useState, useRef, KeyboardEvent } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Close,
  Image,
  InsertDriveFile,
  Stop,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
  chatType?: string;
  isStreaming?: boolean;
  isMobile?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
  chatType,
  isStreaming = false,
  isMobile = false,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();

  const handleSend = () => {
    if ((message.trim() || attachments.length > 0) && !disabled && !isStreaming) {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
      setIsTyping(false);
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
    <Box sx={{ p: 3 }}>
      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {attachments.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Chip
                    icon={file.type.startsWith('image/') ? <Image /> : <InsertDriveFile />}
                    label={file.name}
                    onDelete={() => removeAttachment(index)}
                    deleteIcon={<Close />}
                    sx={{
                      background: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
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
          p: 2,
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
        />

        {/* Attach Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
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
        </motion.div>

        {/* Text Field */}
        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
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
            disabled={(!message.trim() && attachments.length === 0) || disabled}
            sx={{
              background: isStreaming 
                ? theme.palette.error.main
                : (message.trim() || attachments.length > 0)
                ? getGradient()
                : 'transparent',
              color: (message.trim() || attachments.length > 0) || isStreaming
                ? 'white'
                : theme.palette.text.secondary,
              '&:hover': {
                background: isStreaming
                  ? theme.palette.error.dark
                  : (message.trim() || attachments.length > 0)
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

      {/* Character Count */}
      <AnimatePresence>
        {message.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'right',
                mt: 1,
                color: message.length > 4000 
                  ? theme.palette.error.main 
                  : theme.palette.text.secondary,
              }}
            >
              {message.length} / 4000
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default MessageInput;