import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  alpha,
  useTheme,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Person,
  SmartToy,
  Psychology,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface AnimatedMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    isStreaming?: boolean;
    createdAt?: Date;
  };
  index: number;
  chatType?: 'claude' | 'grok' | 'general';
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ message, index, chatType }) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [typedContent, setTypedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Эффект печати для streaming сообщений
  useEffect(() => {
    if (message.isStreaming && !isUser) {
      setIsTyping(true);
      const chars = message.content.split('');
      let currentIndex = typedContent.length;
      
      const typeInterval = setInterval(() => {
        if (currentIndex < chars.length) {
          setTypedContent(message.content.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          setIsTyping(false);
        }
      }, 5); // Очень быстрая печать для streaming

      return () => clearInterval(typeInterval);
    } else {
      setTypedContent(message.content);
    }
  }, [message.content, message.isStreaming, isUser]);

  const getAIAvatar = () => {
    if (chatType === 'claude') {
      return (
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
            animation: message.isStreaming ? 'rotate 3s linear infinite' : 'none',
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        >
          <SmartToy />
        </Avatar>
      );
    }
    
    if (chatType === 'grok') {
      return (
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            animation: message.isStreaming ? 'pulse 1.5s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            },
          }}
        >
          <Psychology />
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
        <SmartToy />
      </Avatar>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ 
          duration: 0.3,
          delay: index * 0.05,
          ease: "easeOut"
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: index * 0.05 + 0.1
            }}
          >
            {isUser ? (
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <Person />
              </Avatar>
            ) : isSystem ? (
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <SmartToy />
              </Avatar>
            ) : (
              getAIAvatar()
            )}
          </motion.div>

          {/* Message Content */}
          <motion.div
            style={{ flex: 1, maxWidth: '80%' }}
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.05 + 0.2
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 0.5,
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {isUser ? 'You' : isSystem ? 'System' : message.model || 'Assistant'}
              </Typography>
              
              {message.isStreaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Chip
                    label="typing..."
                    size="small"
                    color="primary"
                    sx={{ 
                      height: 20,
                      fontSize: '11px',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)'
                        : theme.palette.primary.main,
                    }}
                  />
                </motion.div>
              )}
            </Box>

            {/* Message Bubble */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: isUser 
                  ? theme.palette.mode === 'dark'
                    ? alpha('#6366f1', 0.2)
                    : '#e8ebff'
                  : theme.palette.mode === 'dark'
                    ? alpha('#1a1a2e', 0.8)
                    : '#f8f9fa',
                border: 1,
                borderColor: isUser
                  ? alpha('#6366f1', 0.3)
                  : 'transparent',
                borderRadius: '20px',
                borderTopLeftRadius: !isUser ? '4px' : '20px',
                borderTopRightRadius: isUser ? '4px' : '20px',
                position: 'relative',
                overflow: 'hidden',
                transform: 'translateZ(0)', // GPU acceleration
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              {/* AI Gradient Border */}
              {!isUser && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: chatType === 'claude'
                      ? 'linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%)'
                      : chatType === 'grok'
                      ? 'linear-gradient(90deg, #667EEA 0%, #764BA2 100%)'
                      : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                    animation: message.isStreaming ? 'shimmer 2s linear infinite' : 'none',
                    '@keyframes shimmer': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(100%)' },
                    },
                  }}
                />
              )}

              {/* Content */}
              <Box sx={{ position: 'relative' }}>
                <ReactMarkdown className="markdown-body">
                  {typedContent || ''}
                </ReactMarkdown>
                
                {/* Typing Cursor */}
                {isTyping && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: '1.2em',
                      backgroundColor: theme.palette.primary.main,
                      marginLeft: '2px',
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </Box>

              {/* Progress Indicator */}
              {message.isStreaming && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                  }}
                >
                  <LinearProgress 
                    variant="indeterminate"
                    sx={{
                      height: 2,
                      backgroundColor: 'transparent',
                      '& .MuiLinearProgress-bar': {
                        background: chatType === 'claude'
                          ? 'linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 100%)'
                          : chatType === 'grok'
                          ? 'linear-gradient(90deg, #667EEA 0%, #764BA2 100%)'
                          : theme.palette.primary.main,
                      },
                    }}
                  />
                </Box>
              )}
            </Paper>
          </motion.div>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedMessage; 