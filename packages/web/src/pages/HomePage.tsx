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
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Chat,
  Psychology,
  AutoAwesome,
  Add,
  Folder,
  Settings,
  TrendingUp,
  Speed,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { keyframes } from '@mui/system';
import { Logo } from '@neuralchat/ui-kit';

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

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
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
      description: 'Умный помощник Claude для сложных задач, анализа кода и творческих проектов',
      icon: <Chat sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      shadowColor: 'rgba(5, 150, 105, 0.25)',
      action: () => navigate('/chat/claude'),
      features: ['Анализ кода', 'Творческое письмо', 'Решение задач'],
    },
    {
      id: 'grok',
      title: 'Grok Chat',
      description: 'Креативный и остроумный Grok для нестандартных решений и инноваций',
      icon: <Psychology sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
      shadowColor: 'rgba(220, 38, 38, 0.25)',
      action: () => navigate('/chat/grok'),
      features: ['Креативность', 'Юмор', 'Нестандартность'],
    },
    {
      id: 'brainstorm',
      title: 'Brainstorm Mode',
      description: 'Коллаборация Claude и Grok для максимального творческого потенциала',
      icon: <AutoAwesome sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      shadowColor: 'rgba(236, 72, 153, 0.25)',
      action: () => navigate('/brainstorm'),
      badge: 'NEW',
      features: ['Мозговой штурм', 'Коллаборация', 'Синергия'],
    },
  ];

  const quickActions = [
    {
      title: 'Новая беседа',
      icon: <Add />,
      action: () => navigate('/chat/claude'),
      color: '#6366f1',
    },
    {
      title: 'Проекты',
      icon: <Folder />,
      action: () => navigate('/projects'),
      color: '#8b5cf6',
    },
    {
      title: 'Аналитика',
      icon: <TrendingUp />,
      action: () => navigate('/analytics'),
      color: '#ec4899',
    },
    {
      title: 'Настройки',
      icon: <Settings />,
      action: () => navigate('/settings'),
      color: '#06b6d4',
    },
  ];

  const usagePercentage = (stats as any)?.usage?.daily
    ? ((stats as any).usage.daily.messages / (stats as any).usage.daily.limit) * 100
    : 25; // fallback for demo

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  return (
    <Box
      className="homepage-container page-content"
      sx={{
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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
      <Box 
        className="flex-grow-content mobile-compact"
        sx={{ 
          p: isMobile ? 1 : 2, 
          maxWidth: '1200px', 
          mx: 'auto',
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Welcome Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 2,
            flexShrink: 0,
            animation: `${fadeIn} 0.6s ease`,
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Logo 
              variant="full" 
              size="large"
              color="primary"
              darkMode={theme.palette.mode === 'dark'}
              onClick={() => navigate('/')}
            />
          </Box>

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
            {getTimeOfDay()}, {user?.name || 'Максим'}! 👋
          </Typography>
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            sx={{
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.6)'
                : '#6b7280',
              mb: 2,
            }}
          >
            Готовы к продуктивной работе с ИИ?
          </Typography>

          {/* Quick Actions */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            flexWrap: 'wrap',
            mb: 2,
          }}>
            {quickActions.map((action, index) => (
              <Tooltip key={action.title} title={action.title}>
                <IconButton
                  onClick={action.action}
                  sx={{
                    background: alpha(action.color, 0.1),
                    color: action.color,
                    width: 56,
                    height: 56,
                    '&:hover': {
                      background: alpha(action.color, 0.2),
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease',
                    animation: `${cardSlideIn} 0.6s ease ${index * 0.1}s both`,
                  }}
                >
                  {action.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>

        {/* Usage Stats Card */}
        <Card
          sx={{
            mb: 2,
            flexShrink: 0,
            background: theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 45, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: '20px',
            animation: `${cardSlideIn} 0.6s ease 0.1s both`,
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 20px 40px rgba(139, 92, 246, 0.1)'
                : '0 20px 40px rgba(0, 0, 0, 0.08)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed sx={{ mr: 2, color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Сегодняшняя активность
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Использовано сообщений
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {(stats as any)?.usage?.daily?.messages || 12} / {(stats as any)?.usage?.daily?.limit || 50}
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={usagePercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 2,
                '& .MuiLinearProgress-bar': {
                  background: usagePercentage > 80 
                    ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                    : usagePercentage > 60
                    ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  borderRadius: 4,
                },
              }}
            />
            
            <Typography variant="caption" color="text.secondary">
              {usagePercentage < 80 
                ? '🚀 Отличная производительность!'
                : usagePercentage < 95
                ? '⚡ Активно используете ИИ!'
                : '🔥 Максимальная загрузка!'}
            </Typography>
          </CardContent>
        </Card>

        {/* AI Cards */}
        <Grid 
          container 
          spacing={2}
          sx={{ 
            flex: 1,
            alignContent: 'flex-start'
          }}
        >
          {aiCards.map((card, index) => (
            <Grid item xs={12} md={4} key={card.id}>
              <Card
                sx={{
                  height: '100%',
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(30, 30, 45, 0.8)'
                    : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  borderRadius: '20px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `${cardSlideIn} 0.6s ease ${index * 0.1 + 0.2}s both`,
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${card.shadowColor}`,
                    '& .card-icon': {
                      animation: `${pulse} 1s ease infinite`,
                    },
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: card.gradient,
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={card.action}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      className="card-icon"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 64,
                        height: 64,
                        borderRadius: '16px',
                        background: card.gradient,
                        color: 'white',
                        mr: 2,
                        boxShadow: `0 8px 16px ${card.shadowColor}`,
                      }}
                    >
                      {card.icon}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {card.title}
                        </Typography>
                        {card.badge && (
                          <Chip
                            label={card.badge}
                            size="small"
                            sx={{
                              background: card.gradient,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 20,
                              animation: `${pulse} 2s ease infinite`,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, lineHeight: 1.6 }}
                  >
                    {card.description}
                  </Typography>

                  {/* Features */}
                  <Box sx={{ mb: 3 }}>
                    {card.features?.map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        size="small"
                        variant="outlined"
                        sx={{
                          mr: 0.5,
                          mb: 0.5,
                          fontSize: '0.7rem',
                          borderColor: alpha(theme.palette.text.secondary, 0.3),
                        }}
                      />
                    ))}
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 'auto',
                      background: card.gradient,
                      borderRadius: '12px',
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: card.gradient,
                        opacity: 0.9,
                      },
                    }}
                  >
                    Начать работу
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