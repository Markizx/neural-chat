import React from 'react';
import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  AutoAwesome,
  Psychology,
  ChatBubbleOutline,
  TipsAndUpdates,
} from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  chatType?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, chatType }) => {
  const theme = useTheme();

  const getGradient = () => {
    if (chatType === 'claude') {
      return 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)';
    }
    if (chatType === 'grok') {
      return 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)';
    }
    return 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  };

  const getIcon = () => {
    if (chatType === 'claude') return <AutoAwesome sx={{ fontSize: 40 }} />;
    if (chatType === 'grok') return <Psychology sx={{ fontSize: 40 }} />;
    return <ChatBubbleOutline sx={{ fontSize: 40 }} />;
  };

  const suggestions = chatType === 'claude' 
    ? [
        'Explain quantum computing in simple terms',
        'Write a creative story about time travel',
        'Help me debug this code snippet',
        'Analyze this business strategy'
      ]
    : chatType === 'grok'
    ? [
        'What are the latest AI developments?',
        'Explain the concept of consciousness',
        'Analyze recent tech industry trends',
        'Discuss the future of space exploration'
      ]
    : [
        'Ask me anything!',
        'Need help with a project?',
        'Want to learn something new?',
        'Let\'s brainstorm ideas'
      ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 400,
        textAlign: 'center',
        p: 4,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: getGradient(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(99, 102, 241, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-20px)' },
            },
          }}
        >
          <Box sx={{ color: 'white' }}>
            {getIcon()}
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Typography 
          variant="h5" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            background: getGradient(),
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ mb: 4 }}
        >
          {subtitle}
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{ width: '100%', maxWidth: 600 }}
      >
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'center' }}>
            <TipsAndUpdates sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Try one of these prompts to get started:
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.3,
                  delay: 0.5 + index * 0.1,
                  type: 'spring',
                  stiffness: 200
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderRadius: '20px',
                    border: 1,
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    background: theme.palette.mode === 'dark'
                      ? alpha('#1a1a2e', 0.6)
                      : alpha(theme.palette.primary.main, 0.05),
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: theme.palette.primary.main,
                      background: alpha(theme.palette.primary.main, 0.1),
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <Typography variant="body2">
                    {suggestion}
                  </Typography>
                </Paper>
              </motion.div>
            ))}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
};

export default EmptyState; 