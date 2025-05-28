import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Chat,
  Psychology,
  AutoAwesome,
  TrendingUp,
  Speed,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiService.get('/user/usage');
      return response.data;
    },
  });

  const features = [
    {
      icon: <Chat sx={{ fontSize: 40 }} />,
      title: 'Claude Chat',
      description: 'Chat with Claude AI models including the latest Opus 4',
      action: () => navigate('/chat/claude'),
      color: '#667eea',
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: 'Grok Chat',
      description: 'Experience Grok\'s unique perspective and capabilities',
      action: () => navigate('/chat/grok'),
      color: '#764ba2',
    },
    {
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      title: 'Brainstorm Mode',
      description: 'Let Claude and Grok collaborate on your ideas',
      action: () => navigate('/brainstorm'),
      color: '#f093fb',
      badge: 'NEW',
    },
  ];

  const advantages = [
    {
      icon: <Speed />,
      title: 'Lightning Fast',
      description: 'Get instant responses with streaming support',
    },
    {
      icon: <Security />,
      title: 'Secure & Private',
      description: 'Your data is encrypted and never shared',
    },
    {
      icon: <TrendingUp />,
      title: 'Always Improving',
      description: 'Access to the latest AI models and features',
    },
  ];

  const usagePercentage = (stats as any)?.usage?.daily
    ? ((stats as any).usage.daily.messages / (stats as any).usage.daily.limit) * 100
    : 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography
          variant="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Choose your AI assistant to start a conversation
        </Typography>
      </Box>

      {/* Usage Stats */}
      {stats && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Today's Usage
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {(stats as any)?.usage?.daily?.messages || 0} / {(stats as any)?.usage?.daily?.limit || 0} messages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(usagePercentage)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={usagePercentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                },
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Messages
              </Typography>
              <Typography variant="h5">{(stats as any)?.usage?.total?.messages || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Chats
              </Typography>
              <Typography variant="h5">{(stats as any)?.usage?.total?.chats || 0}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Plan
              </Typography>
              <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                {user?.subscription.plan}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Features Grid */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              {feature.badge && (
                <Chip
                  label={feature.badge}
                  color="secondary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                  }}
                />
              )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${feature.color}33 0%, ${feature.color}66 100%)`,
                    mb: 2,
                  }}
                >
                  <Box sx={{ color: feature.color }}>{feature.icon}</Box>
                </Box>
                <Typography variant="h5" component="h3" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="large"
                  onClick={feature.action}
                  sx={{
                    ml: 1,
                    mb: 1,
                    background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}dd 100%)`,
                    color: 'white',
                    '&:hover': {
                      background: `linear-gradient(135deg, ${feature.color}dd 0%, ${feature.color}aa 100%)`,
                    },
                  }}
                >
                  Start Chat
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Advantages Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Why NeuralChat?
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {advantages.map((advantage, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  margin: '0 auto 16px',
                }}
              >
                {advantage.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {advantage.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {advantage.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage;