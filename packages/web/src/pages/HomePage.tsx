import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Chat,
  Psychology,
  AutoAwesome,
  Add,
  TrendingUp,
  Message,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { keyframes } from '@mui/system';

// Анимации
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const cardSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiService.get('/user/usage');
      return response.data;
    },
  });

  const aiCards = [
    {
      id: 'claude',
      title: 'Claude Chat',
      description: 'Общайтесь с последней версией Claude AI, включая мощную модель Claude 3.5 Sonnet и Claude 3 Opus для сложных задач',
      icon: <Chat sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      shadowColor: 'rgba(139, 92, 246, 0.25)',
      action: () => navigate('/chat/claude'),
    },
    {
      id: 'grok',
      title: 'Grok Chat',
      description: 'Исследуйте уникальную перспективу Grok с его особым подходом к решению задач, включая новый Grok-3',
      icon: <Psychology sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      shadowColor: 'rgba(59, 130, 246, 0.25)',
      action: () => navigate('/chat/grok'),
    },
    {
      id: 'brainstorm',
      title: 'Brainstorm Mode',
      description: 'Позвольте Claude и Grok работать вместе над вашими идеями для максимальной креативности',
      icon: <AutoAwesome sx={{ fontSize: 28 }} />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      shadowColor: 'rgba(236, 72, 153, 0.25)',
      action: () => navigate('/brainstorm'),
      badge: 'NEW',
    },
  ];

  const usagePercentage = (stats as any)?.usage?.daily
    ? ((stats as any).usage.daily.messages / (stats as any).usage.daily.limit) * 100
    : 0;

  return (
    <Box
      sx={{
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #fafafb 0%, #f3f4f6 100%)',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: theme.palette.mode === 'dark'
            ? `
              radial-gradient(circle at 20% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 60%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
            `
            : `
              radial-gradient(circle at 20% 40%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 60%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)
            `,
          pointerEvents: 'none',
          zIndex: -1,
        },
      }}
    >
      {/* Glow Effects */}
      <Box
        sx={{
          position: 'fixed',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          top: '-150px',
          right: '-150px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
          bottom: '-200px',
          left: '-200px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      <Box sx={{ p: isMobile ? 2 : 4, maxWidth: '1200px', mx: 'auto' }}>
        {/* Welcome Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 6,
            animation: `${fadeIn} 0.6s ease`,
          }}
        >
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            sx={{
              fontWeight: 700,
              mb: 1,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #a78bfa 100%)'
                : 'linear-gradient(135deg, #1a1a1a 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Добро пожаловать, {user?.name || 'Максим'}!
          </Typography>
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            sx={{
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.6)'
                : '#6b7280',
            }}
          >
            Выберите AI-ассистента для начала работы
          </Typography>
        </Box>

        {/* Usage Stats Card */}
        <Card
          sx={{
            mb: 4,
            background: theme.palette.mode === 'dark'
              ? 'rgba(20, 20, 30, 0.6)'
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.08)'
            }`,
            borderRadius: '16px',
            boxShadow: theme.palette.mode === 'dark'
              ? 'none'
              : '0 4px 12px rgba(0, 0, 0, 0.04)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.8)'
                    : '#374151',
                  fontWeight: 500,
                }}
              >
                Использование сегодня
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.6)'
                    : '#6b7280',
                }}
              >
                {(stats as any)?.usage?.daily?.messages || 0} / {(stats as any)?.usage?.daily?.limit || 10} сообщений
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={usagePercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.06)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 0 10px rgba(139, 92, 246, 0.5)' 
                    : '0 0 10px rgba(139, 92, 246, 0.3)',
                },
              }}
            />

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                    }}
                  >
                    {(stats as any)?.usage?.total?.messages || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.5)'
                        : '#6b7280',
                    }}
                  >
                    Всего сообщений
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                    }}
                  >
                    {(stats as any)?.usage?.total?.chats || 0}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.5)'
                        : '#6b7280',
                    }}
                  >
                    Всего чатов
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                    }}
                  >
                    Free
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.5)'
                        : '#6b7280',
                    }}
                  >
                    Текущий план
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* AI Cards Grid */}
        <Grid container spacing={3}>
          {aiCards.map((card, index) => (
            <Grid item xs={12} md={4} key={card.id}>
              <Card
                sx={{
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(20, 20, 30, 0.6)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.08)'
                  }`,
                  borderRadius: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  animation: `${cardSlideIn} 0.6s ease`,
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: 'both',
                  boxShadow: theme.palette.mode === 'dark'
                    ? 'none'
                    : '0 4px 12px rgba(0, 0, 0, 0.04)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(139, 92, 246, 0.2)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 12px 24px rgba(0, 0, 0, 0.4)'
                      : '0 12px 24px rgba(0, 0, 0, 0.08)',
                    '&::before': {
                      opacity: 1,
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, transparent 0%, rgba(139, 92, 246, 0.1) 100%)'
                      : 'linear-gradient(135deg, transparent 0%, rgba(139, 92, 246, 0.06) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                  },
                }}
                onClick={card.action}
              >
                {card.badge && (
                  <Chip
                    label={card.badge}
                    sx={{
                      position: 'absolute',
                      top: 20,
                      right: 20,
                      background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                      color: 'white',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      zIndex: 1,
                    }}
                  />
                )}
                <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: card.gradient,
                      color: 'white',
                      mb: 2.5,
                      boxShadow: `0 8px 16px ${card.shadowColor}`,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.6)'
                        : '#6b7280',
                      lineHeight: 1.6,
                      mb: 3,
                    }}
                  >
                    {card.description}
                  </Typography>
                  <Button
                    fullWidth
                    variant="outlined"
                    sx={{
                      borderColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.1)',
                      background: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                      color: theme.palette.mode === 'dark' ? 'white' : '#374151',
                      borderRadius: '12px',
                      py: 1.5,
                      fontWeight: 500,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-1px)',
                        color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                      },
                    }}
                  >
                    Начать чат
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage;