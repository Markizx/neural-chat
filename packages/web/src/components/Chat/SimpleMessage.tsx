import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Fade,
  Slide,
  Modal,
  Backdrop,
  IconButton,
} from '@mui/material';
import {
  Person,
  SmartToy,
  Close,
  InsertDriveFile,
  Image as ImageIcon,
  Code,
  Article,
  DescriptionOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '../../hooks/useTranslation';

interface SimpleMessageProps {
  message: {
    _id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    createdAt: string | Date;
    attachments?: any[];
  };
  isStreaming?: boolean;
  isNew?: boolean;
}

const SimpleMessage: React.FC<SimpleMessageProps> = ({ 
  message, 
  isStreaming = false,
  isNew = false 
}) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [modalImage, setModalImage] = useState<string | null>(null);

  const formatModel = (model?: string) => {
    if (!model) return t('chat.models.assistant');
    
    if (model.includes('claude')) {
      return 'Claude';
    } else if (model.includes('grok')) {
      return 'Grok';
    }
    return model;
  };

  const getFileIcon = (mimeType: string, type: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon sx={{ fontSize: 16 }} />;
    } else if (type === 'code' || mimeType.includes('javascript') || mimeType.includes('python')) {
      return <Code sx={{ fontSize: 16 }} />;
    } else if (mimeType.includes('text/') || mimeType.includes('markdown')) {
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
    <>
      <Slide 
        direction={isUser ? "left" : "right"} 
        in={true} 
        timeout={isNew ? 500 : 0}
      >
        <Box>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 3,
              flexDirection: isUser ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              opacity: isNew ? 0 : 1,
              animation: isNew ? 'fadeInUp 0.6s ease-out forwards' : 'none',
              '@keyframes fadeInUp': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
            }}
          >
          {/* Avatar с анимацией */}
          <Fade in={true} timeout={300}>
            <Avatar
              sx={{
                bgcolor: isUser ? 'primary.main' : 'secondary.main',
                width: 40,
                height: 40,
                flexShrink: 0,
                boxShadow: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: 4,
                },
              }}
            >
              {isUser ? <Person /> : <SmartToy />}
            </Avatar>
          </Fade>

          {/* Message Content */}
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: '80%' }}>
            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {isUser ? t('common.you', 'Вы') : formatModel(message.model)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {format(new Date(message.createdAt), 'HH:mm', { locale: ru })}
              </Typography>
              {isStreaming && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'primary.main',
                    fontStyle: 'italic',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                >
                  {t('chat.thinking', 'печатает...')}
                </Typography>
              )}
            </Box>

            {/* Message Bubble с анимацией */}
            <Paper
              elevation={isUser ? 3 : 1}
              sx={{
                p: 2.5,
                bgcolor: isUser 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'background.paper',
                background: isUser 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : undefined,
                color: isUser ? 'white' : 'text.primary',
                borderRadius: 3,
                borderTopLeftRadius: !isUser ? 1 : 3,
                borderTopRightRadius: isUser ? 1 : 3,
                border: isUser ? 'none' : 1,
                borderColor: 'divider',
                position: 'relative',
                wordBreak: 'break-word',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isUser ? 6 : 4,
                },
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
                    bgcolor: isUser ? 'rgba(255,255,255,0.15)' : 'grey.100',
                    p: 1.5,
                    borderRadius: 1,
                    overflow: 'auto',
                    border: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                  },
                  '& code': {
                    bgcolor: isUser ? 'rgba(255,255,255,0.15)' : 'grey.100',
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
              }}
            >
              {isUser ? (
                <>
                  {/* Attachments for user messages */}
                  {message.attachments && message.attachments.length > 0 && (
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
                            {isImage && attachment.url ? (
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
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}
                  >
                    {message.content}
                  </Typography>
                </>
              ) : (
                <ReactMarkdown className="markdown-body">
                  {message.content}
                </ReactMarkdown>
              )}

              {/* Streaming cursor */}
              {isStreaming && (
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: '2px',
                    height: '1.2em',
                    bgcolor: isUser ? 'white' : 'primary.main',
                    animation: 'cursor-blink 1s ease-in-out infinite',
                    verticalAlign: 'text-bottom',
                    ml: 0.5,
                    '@keyframes cursor-blink': {
                      '0%, 50%': { opacity: 1 },
                      '51%, 100%': { opacity: 0 },
                    },
                  }}
                />
              )}
            </Paper>
          </Box>
          </Box>
        </Box>
      </Slide>
      
      {/* Image Modal */}
      <Modal
        open={!!modalImage}
        onClose={closeModal}
        BackdropComponent={Backdrop}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
          }}
        >
          <IconButton
            onClick={closeModal}
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
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
              alt="Full size image"
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: 2,
                boxShadow: 24,
              }}
            />
          )}
        </Box>
      </Modal>
    </>
  );
};

export default SimpleMessage; 