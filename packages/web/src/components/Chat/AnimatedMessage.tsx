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
  Modal,
  Backdrop,
  IconButton,
} from '@mui/material';
import { Fade } from '@mui/material';
import {
  Person,
  SmartToy,
  Psychology,
  Close,
  Image as ImageIcon,
  Code,
  Article,
  DescriptionOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AnimatedMessageProps {
  message: {
    _id?: string;
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    isStreaming?: boolean;
    createdAt?: string | Date;
    attachments?: any[];
  };
  index: number;
  chatType?: 'claude' | 'grok' | 'general';
  isNew?: boolean;
}

const AnimatedMessage: React.FC<AnimatedMessageProps> = ({ 
  message, 
  index, 
  chatType
}) => {
  const theme = useTheme();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const [typedContent, setTypedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);

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
      }, 3); // Быстрая печать для streaming

      return () => clearInterval(typeInterval);
    } else {
      setTypedContent(message.content);
      setIsTyping(false);
    }
  }, [message.content, message.isStreaming, isUser, typedContent.length]);

  const getAIAvatar = () => {
    if (chatType === 'claude') {
      return (
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            animation: message.isStreaming ? 'rotate 3s linear infinite' : 'none',
            boxShadow: message.isStreaming ? '0 0 20px rgba(99,102,241,0.5)' : 'none',
            '@keyframes rotate': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          }}
        >
          <SmartToy sx={{ color: 'white' }} />
        </Avatar>
      );
    }
    
    if (chatType === 'grok') {
      return (
        <Avatar
          sx={{
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            animation: message.isStreaming ? 'pulse 1.5s ease-in-out infinite' : 'none',
            boxShadow: message.isStreaming ? '0 0 20px rgba(239,68,68,0.5)' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.1)', opacity: 0.8 },
            },
          }}
        >
          <Psychology sx={{ color: 'white' }} />
        </Avatar>
      );
    }

    return (
      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
        <SmartToy />
      </Avatar>
    );
  };

  const formatModel = (model?: string) => {
    if (!model) return 'Assistant';
    
    if (model.includes('claude')) {
      return 'Claude';
    } else if (model.includes('grok')) {
      return 'Grok';
    }
    return model;
  };

  const getFileIcon = (mimeType: string, type: string) => {
    if (mimeType && mimeType.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 16 }} />;
    } else if (type === 'code' || (mimeType && (mimeType.includes('javascript') || mimeType.includes('python')))) {
      return <Code sx={{ fontSize: 16 }} />;
    } else if (mimeType && (mimeType.includes('text/') || mimeType.includes('markdown'))) {
      return <Article sx={{ fontSize: 16 }} />;
    } else {
      return <DescriptionOutlined sx={{ fontSize: 16 }} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const handleImageClick = (url: string) => {
    setModalImage(url);
  };

  const closeModal = () => {
    setModalImage(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.4,
          delay: index * 0.03,
          ease: "easeOut"
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
          }}
        >
          {/* Avatar с анимацией */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: index * 0.03 + 0.1
            }}
          >
            {isUser ? (
              <Avatar 
                sx={{ 
                  bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  width: 40,
                  height: 40,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
                  },
                }}
              >
                <Person sx={{ color: 'white' }} />
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
            style={{ flex: 1, maxWidth: '80%', minWidth: 0 }}
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              duration: 0.5,
              delay: index * 0.03 + 0.2
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
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600,
                  color: isUser ? 'primary.main' : 'text.primary',
                }}
              >
                {isUser ? 'Вы' : isSystem ? 'System' : formatModel(message.model)}
              </Typography>
              
              {message.createdAt && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {format(new Date(message.createdAt), 'HH:mm', { locale: ru })}
                </Typography>
              )}
              
              {message.isStreaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Chip
                    label="печатает..."
                    size="small"
                    color="primary"
                    sx={{ 
                      height: 20,
                      fontSize: '11px',
                      animation: 'pulse 1.5s ease-in-out infinite',
                      background: chatType === 'claude'
                        ? 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)'
                        : chatType === 'grok'
                        ? 'linear-gradient(45deg, #ef4444 30%, #f97316 90%)'
                        : theme.palette.primary.main,
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.7, transform: 'scale(0.95)' },
                      },
                    }}
                  />
                </motion.div>
              )}
            </Box>

            {/* Message Bubble */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.3,
                delay: index * 0.03 + 0.3
              }}
              whileHover={{ 
                y: -2,
                transition: { duration: 0.2 }
              }}
            >
              <Paper
                elevation={isUser ? 4 : 2}
                sx={{
                  p: 2.5,
                  bgcolor: isUser 
                    ? 'transparent'
                    : theme.palette.background.paper,
                  background: isUser 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : undefined,
                  color: isUser ? 'white' : 'text.primary',
                  borderRadius: '20px',
                  borderTopLeftRadius: !isUser ? '6px' : '20px',
                  borderTopRightRadius: isUser ? '6px' : '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  wordBreak: 'break-word',
                  transition: 'all 0.3s ease',
                  transform: 'translateZ(0)', // GPU acceleration
                  border: isUser ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': {
                    boxShadow: isUser 
                      ? '0 8px 30px rgba(102,126,234,0.3)'
                      : theme.shadows[6],
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
                        ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                        : chatType === 'grok'
                        ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
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
                <Box sx={{ 
                  position: 'relative',
                  '& .markdown-body': {
                    color: 'inherit',
                    '& p': {
                      margin: 0,
                      lineHeight: 1.6,
                      '&:not(:last-child)': {
                        mb: 1,
                      },
                    },
                    '& pre': {
                      bgcolor: isUser ? 'rgba(255,255,255,0.15)' : alpha(theme.palette.grey[100], 0.8),
                      p: 1.5,
                      borderRadius: 1,
                      overflow: 'auto',
                      border: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                      '& code': {
                        bgcolor: 'transparent',
                      },
                    },
                    '& code': {
                      bgcolor: isUser ? 'rgba(255,255,255,0.15)' : alpha(theme.palette.grey[100], 0.8),
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      fontSize: '0.875em',
                      fontFamily: '"Fira Code", "Monaco", monospace',
                    },
                    '& h1, & h2, & h3': {
                      color: 'inherit',
                      mt: 1,
                      mb: 0.5,
                    },
                    '& ul, & ol': {
                      pl: 2,
                      '& li': {
                        mb: 0.25,
                      },
                    },
                  },
                }}>
                  {/* Attachments for user messages */}
                  {isUser && message.attachments && message.attachments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {message.attachments.map((attachment, index) => {
                        const isImage = attachment.mimeType && attachment.mimeType.startsWith('image/');
                        
                        return (
                          <Box
                            key={attachment.id || index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              p: 1.5,
                              mb: 1,
                              backgroundColor: 'rgba(255, 255, 255, 0.15)',
                              borderRadius: 2,
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              transition: 'all 0.2s ease',
                              cursor: isImage ? 'pointer' : 'default',
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                transform: isImage ? 'scale(1.02)' : 'none',
                              },
                            }}
                            onClick={isImage && attachment.url ? () => handleImageClick(attachment.url) : undefined}
                          >
                            {isImage ? (
                              <>
                                <Box
                                  component="img"
                                  src={attachment.url}
                                  alt={attachment.name}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 1,
                                    objectFit: 'cover',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                  }}
                                />
                                <Typography sx={{ fontSize: '0.8rem' }}>📷</Typography>
                              </>
                            ) : (
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                }}
                              >
                                {getFileIcon(attachment.mimeType || '', attachment.type || '')}
                              </Box>
                            )}
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.875rem',
                                  fontWeight: 500,
                                  color: 'white',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {attachment.name}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.75rem',
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {attachment.mimeType || 'unknown'} • {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

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
                        backgroundColor: isUser ? 'white' : theme.palette.primary.main,
                        marginLeft: '2px',
                        verticalAlign: 'text-bottom',
                      }}
                    />
                  )}
                </Box>

                {/* Progress Indicator для streaming */}
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
                            ? 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
                            : chatType === 'grok'
                            ? 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)'
                            : theme.palette.primary.main,
                        },
                      }}
                    />
                  </Box>
                )}
              </Paper>
            </motion.div>
          </motion.div>
        </Box>
      </motion.div>

      {/* Modal for image preview */}
      <Modal
        open={!!modalImage}
        onClose={closeModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Fade in={!!modalImage}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxWidth: '90vw',
              maxHeight: '90vh',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <IconButton
              onClick={closeModal}
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <Close />
            </IconButton>
            {modalImage && (
              <Box
                component="img"
                src={modalImage}
                alt="Attachment preview"
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              />
            )}
          </Box>
        </Fade>
      </Modal>
    </AnimatePresence>
  );
};

export default AnimatedMessage; 