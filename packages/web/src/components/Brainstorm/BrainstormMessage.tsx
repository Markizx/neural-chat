import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  SmartToy,
  Psychology,
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
  };
  isStreaming?: boolean;
}

const BrainstormMessage: React.FC<BrainstormMessageProps> = ({ message, isStreaming = false }) => {
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
      </motion.div>
    </AnimatePresence>
  );
};

export default BrainstormMessage;