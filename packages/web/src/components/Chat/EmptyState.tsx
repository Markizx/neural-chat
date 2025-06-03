import React from 'react';
import {
  Box,
  Typography,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import {
  SmartToy,
  Psychology,
  AutoAwesome,
  Lightbulb,
  Code,
  Article,
} from '@mui/icons-material';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  chatType: 'claude' | 'grok' | 'general';
  onSuggestionClick?: (suggestion: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  chatType,
  onSuggestionClick,
}) => {
  const theme = useTheme();

  const getChatIcon = () => {
    if (chatType === 'claude') return <SmartToy sx={{ fontSize: 48, color: '#6366f1' }} />;
    if (chatType === 'grok') return <Psychology sx={{ fontSize: 48, color: '#ef4444' }} />;
    return <AutoAwesome sx={{ fontSize: 48, color: theme.palette.primary.main }} />;
  };

  const getSuggestions = () => {
    if (chatType === 'claude') {
      return [
        { icon: <Code />, text: 'Помоги с кодом' },
        { icon: <Article />, text: 'Напиши статью' },
        { icon: <Lightbulb />, text: 'Объясни концепт' },
        { icon: <AutoAwesome />, text: 'Творческая задача' },
      ];
    }
    
    if (chatType === 'grok') {
      return [
        { icon: <Psychology />, text: 'Анализ данных' },
        { icon: <Code />, text: 'Решение проблем' },
        { icon: <Article />, text: 'Исследование темы' },
        { icon: <AutoAwesome />, text: 'Креативное мышление' },
      ];
    }

    return [
      { icon: <Article />, text: 'Задать вопрос' },
      { icon: <Code />, text: 'Помощь с кодом' },
      { icon: <Lightbulb />, text: 'Узнать что-то новое' },
      { icon: <AutoAwesome />, text: 'Начать беседу' },
    ];
  };

  const suggestions = getSuggestions();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        p: 4,
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: '50%',
          background: alpha(
            chatType === 'claude' ? '#6366f1' : chatType === 'grok' ? '#ef4444' : theme.palette.primary.main,
            0.1
          ),
          border: `2px solid ${alpha(
            chatType === 'claude' ? '#6366f1' : chatType === 'grok' ? '#ef4444' : theme.palette.primary.main,
            0.2
          )}`,
        }}
      >
        {getChatIcon()}
      </Box>

      {/* Title & Subtitle */}
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 700,
          background: chatType === 'claude'
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
            : chatType === 'grok'
            ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
            : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {subtitle}
      </Typography>

      {/* Suggestions */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 2,
          width: '100%',
          maxWidth: 500,
        }}
      >
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outlined"
            startIcon={suggestion.icon}
            onClick={() => onSuggestionClick?.(suggestion.text)}
            sx={{
              p: 2,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 500,
              background: alpha(theme.palette.background.paper, 0.5),
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              color: 'text.primary',
              '&:hover': {
                background: alpha(
                  chatType === 'claude' ? '#6366f1' : chatType === 'grok' ? '#ef4444' : theme.palette.primary.main,
                  0.1
                ),
                borderColor: chatType === 'claude' ? '#6366f1' : chatType === 'grok' ? '#ef4444' : theme.palette.primary.main,
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {suggestion.text}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default EmptyState; 