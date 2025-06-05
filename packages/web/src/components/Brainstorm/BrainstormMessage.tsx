import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Person,
  SmartToy,
  Psychology,
  Image,
  InsertDriveFile,
  Code,
  Close,
  ZoomIn,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

interface BrainstormMessageProps {
  message: {
    id: string;
    speaker: 'claude' | 'grok' | 'user';
    content: string;
    timestamp: string;
    tokens?: number;
    isStreaming?: boolean;
    attachments?: Array<{
      name: string;
      type?: string;
      size?: number;
      data?: string;
      mimeType?: string;
    }>;
  };
  isStreaming?: boolean;
}

const BrainstormMessage: React.FC<BrainstormMessageProps> = React.memo(({ message, isStreaming = false }) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  
  const getFileIcon = (attachment: any) => {
    if (attachment.mimeType?.startsWith('image/')) return <Image />;
    if (attachment.name?.endsWith('.js') || attachment.name?.endsWith('.ts') || 
        attachment.name?.endsWith('.jsx') || attachment.name?.endsWith('.tsx') ||
        attachment.name?.endsWith('.py') || attachment.name?.endsWith('.java')) return <Code />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const getSpeakerInfo = () => {
    switch (message.speaker) {
      case 'claude':
        return {
          name: 'Claude',
          icon: <SmartToy />,
          color: 'primary',
          bgcolor: 'primary.main',
        };
      case 'grok':
        return {
          name: 'Grok',
          icon: <Psychology />,
          color: 'secondary',
          bgcolor: 'secondary.main',
        };
      case 'user':
        return {
          name: 'You',
          icon: <Person />,
          color: 'default',
          bgcolor: 'grey.500',
        };
    }
  };

  const speakerInfo = getSpeakerInfo();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.4,
          ease: "easeOut"
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            alignItems: 'flex-start',
            opacity: isStreaming ? 0.9 : 1,
            animation: isStreaming ? 'pulse 1.5s ease-in-out infinite' : 'none',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 0.9 },
              '50%': { opacity: 1 },
            },
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1
            }}
          >
            <Avatar
              sx={{
                bgcolor: speakerInfo.bgcolor,
                width: 40,
                height: 40,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: `0 8px 25px ${speakerInfo.bgcolor}40`,
                },
              }}
            >
              {speakerInfo.icon}
            </Avatar>
          </motion.div>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {speakerInfo.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(message.timestamp), 'HH:mm:ss')}
          </Typography>
          {message.tokens && !isStreaming && (
            <Chip
              label={`${message.tokens} tokens`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
          {isStreaming && (
            <Chip
              label="typing..."
              size="small"
              color={speakerInfo.color as any}
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                animation: 'blink 1s ease-in-out infinite',
                '@keyframes blink': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
          )}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: message.speaker === 'user' ? 'action.hover' : 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderLeft: 4,
            borderLeftColor: `${speakerInfo.color}.main`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ReactMarkdown className="markdown-body">
            {message.content || (isStreaming ? '...' : '')}
          </ReactMarkdown>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {message.attachments.map((attachment, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      cursor: attachment.mimeType?.startsWith('image/') ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                        ...(attachment.mimeType?.startsWith('image/') && {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        }),
                      },
                    }}
                    onClick={() => {
                      if (attachment.mimeType?.startsWith('image/') && attachment.data) {
                        setSelectedImage(attachment.data);
                      }
                    }}
                  >
                    {attachment.mimeType?.startsWith('image/') && attachment.data ? (
                      <>
                        <Box
                          sx={{
                            position: 'relative',
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={attachment.data}
                            alt={attachment.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'rgba(0,0,0,0.5)',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              '&:hover': { opacity: 1 },
                            }}
                          >
                            <ZoomIn sx={{ color: 'white', fontSize: 16 }} />
                          </Box>
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 120,
                            }}
                          >
                            📷 {attachment.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(attachment.size)}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        {getFileIcon(attachment)}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 150,
                            }}
                          >
                            {attachment.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {attachment.mimeType} • {formatFileSize(attachment.size)}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
          
          {isStreaming && (
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
                color={speakerInfo.color as any}
                sx={{
                  height: 2,
                  '& .MuiLinearProgress-bar': {
                    animationDuration: '1s',
                  },
                }}
              />
            </Box>
          )}
          
          {isStreaming && message.content && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '2px',
                height: '1.2em',
                bgcolor: 'text.primary',
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

        {/* Image Modal */}
        <Dialog
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          maxWidth="lg"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              bgcolor: 'rgba(0, 0, 0, 0.9)',
              backgroundImage: 'none',
            },
          }}
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              onClick={() => setSelectedImage(null)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <Close />
            </IconButton>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size"
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '90vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
});

export default BrainstormMessage;