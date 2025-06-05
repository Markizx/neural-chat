import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome,
  PlayArrow,
  Add,
} from '@mui/icons-material';
import BrainstormSession from '../components/Brainstorm/BrainstormSession';
import BrainstormHistory from '../components/Brainstorm/BrainstormHistory';
import PageContainer from '../components/common/PageContainer';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { useTranslation } from '../hooks/useTranslation';

const BrainstormPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  // const [activeTab, setActiveTab] = useState(id ? 1 : 0); // 0 = История, 1 = Сессия
  const [showNewSession, setShowNewSession] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'brainstorm' | 'debate' | 'analysis' | 'creative'>('brainstorm');
  const [claudeModel, setClaudeModel] = useState('claude-4-sonnet');
  const [grokModel, setGrokModel] = useState('grok-3');

  // Fetch existing session
  const { isLoading } = useQuery({
    queryKey: ['brainstorm', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiService.get(`/brainstorm/${id}`);
      return (response.data as any).data.session;
    },
    enabled: !!id,
  });

  // Start new session mutation
  const startMutation = useMutation({
    mutationFn: async () => {
      // eslint-disable-next-line no-console
      console.log('📤 Sending brainstorm request...', {
        topic: topic,
        description: description,
        participants: {
          claude: { model: claudeModel },
          grok: { model: grokModel }
        },
        settings: {
          format,
          maxTurns: 20,
        },
      });
      
      try {
        const response = await apiService.post('/brainstorm', {
          topic,
          description,
          participants: {
            claude: { model: claudeModel },
            grok: { model: grokModel }
          },
          settings: {
            format,
            maxTurns: 20,
          },
        });
        
        // eslint-disable-next-line no-console
        console.log('📥 Brainstorm response:', response);
        
        // Проверяем структуру ответа
        if (!response || !response.data) {
          throw new Error('Invalid response structure');
        }
        
        const responseData = response.data as any;
        if (!responseData || !responseData.sessionId) {
          // eslint-disable-next-line no-console
          console.error('❌ Invalid response data:', responseData);
          throw new Error('Session ID not found in response');
        }
        
        const sessionId = responseData.sessionId;
        // eslint-disable-next-line no-console
        console.log('🆔 Session ID extracted:', sessionId);
        return sessionId;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Error in mutationFn:', error);
        throw error;
      }
    },
    onSuccess: (sessionId) => {
      // eslint-disable-next-line no-console
      console.log('✅ Brainstorm session created successfully!');
      // eslint-disable-next-line no-console
      console.log('🔄 Preparing navigation to:', `/brainstorm/${sessionId}`);
      
      // Очищаем форму
      setTopic('');
      setDescription('');
      setShowNewSession(false);
      
      // Даем время для обновления состояния перед навигацией
      setTimeout(() => {
        // eslint-disable-next-line no-console
        console.log('🚀 Navigating to session:', sessionId);
        navigate(`/brainstorm/${sessionId}`, { replace: true });
      }, 100);
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.error('❌ Brainstorm creation failed:', error);
      // eslint-disable-next-line no-console
      console.error('❌ Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
    },
  });

  const handleStart = () => {
    if (topic.trim()) {
      // eslint-disable-next-line no-console
      console.log('🚀 Starting brainstorm session with:', { topic, description, format });
      startMutation.mutate();
    }
  };

  const handleSelectSession = (sessionId: string) => {
    navigate(`/brainstorm/${sessionId}`);
  };

  const handleNewSession = () => {
    setShowNewSession(true);
    // setActiveTab(0);
  };

  const handleTabChange = (_event: React.SyntheticEvent, _newValue: number) => {
    // setActiveTab(newValue);
    if (_newValue === 0 && id) {
      // Если переключились на историю, убираем ID из URL
      navigate('/brainstorm');
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Если есть ID сессии, показываем сессию
  if (id) {
    return (
      <PageContainer>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            background: theme.palette.mode === 'dark'
              ? 'rgba(18, 18, 24, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <Tabs value={1} onChange={handleTabChange}>
            <Tab label={t('brainstorm.history')} />
            <Tab label={t('brainstorm.currentSession')} />
          </Tabs>
        </Paper>
        
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <BrainstormSession sessionId={id} />
        </Box>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={2}
        sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          p: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(18,18,24,0.95) 0%, rgba(30,30,36,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography 
              variant="h4"
              sx={{
                fontWeight: 700,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mb: 0.5,
              }}
            >
              🧠 Мозговой штурм
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Объедините силы Claude и Grok для решения ваших задач
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={handleNewSession}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: '16px',
              fontSize: '1rem',
              fontWeight: 600,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(129,140,248,0.3)'
                : '0 8px 32px rgba(102,126,234,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                  : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(129,140,248,0.4)'
                  : '0 12px 40px rgba(102,126,234,0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            ✨ Новая сессия
          </Button>
        </Box>
      </Paper>

      {/* Content */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(129,140,248,0.03) 0%, rgba(192,132,252,0.03) 100%)'
            : 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
        }}
      >
        {showNewSession ? (
          <Container maxWidth="md" sx={{ py: 3 }}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 4,
                borderRadius: '20px',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(51,65,85,0.95) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.1)'
                  : '1px solid rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: theme.palette.mode === 'dark'
                    ? 'radial-gradient(circle at 20% 80%, rgba(129,140,248,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(192,132,252,0.15) 0%, transparent 50%)'
                    : 'radial-gradient(circle at 20% 80%, rgba(102,126,234,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(239,68,68,0.1) 0%, transparent 50%)',
                  zIndex: 0,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Typography 
                    variant="h4" 
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      mb: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    🧠 Мозговой штурм с ИИ
                  </Typography>
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.5,
                      maxWidth: '400px',
                      mx: 'auto',
                    }}
                  >
                    Позвольте <strong>Claude</strong> и <strong>Grok</strong> сотрудничать в решении ваших задач
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  label="🎯 Тема для обсуждения"
                  placeholder="Например: Как улучшить нашу продуктивность?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      fontSize: '1.1rem',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      '&:hover': {
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(129,140,248,0.15)'
                          : '0 4px 20px rgba(102,126,234,0.15)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      },
                      '&.Mui-focused': {
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(129,140,248,0.25)'
                          : '0 4px 20px rgba(102,126,234,0.25)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="📝 Дополнительный контекст"
                  placeholder="Предоставьте больше деталей, вопросов или ограничений..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
                      '&:hover': {
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(129,140,248,0.15)'
                          : '0 4px 20px rgba(102,126,234,0.15)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'transparent',
                      },
                      '&.Mui-focused': {
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(129,140,248,0.25)'
                          : '0 4px 20px rgba(102,126,234,0.25)',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'transparent',
                      },
                    },
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                  <FormControl 
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
                        '&:hover': {
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(129,140,248,0.15)'
                            : '0 4px 20px rgba(102,126,234,0.15)',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        },
                      },
                    }}
                  >
                    <InputLabel>🎨 Формат сессии</InputLabel>
                    <Select
                      value={format}
                      onChange={(e) => setFormat(e.target.value as any)}
                      label="🎨 Формат сессии"
                    >
                      <MenuItem value="brainstorm">💡 Мозговой штурм</MenuItem>
                      <MenuItem value="debate">⚔️ Дебаты</MenuItem>
                      <MenuItem value="analysis">🔍 Анализ</MenuItem>
                      <MenuItem value="creative">🎭 Творческий</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl 
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
                        '&:hover': {
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(99,102,241,0.15)'
                            : '0 4px 20px rgba(99,102,241,0.15)',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        },
                      },
                    }}
                  >
                    <InputLabel>🤖 Claude модель</InputLabel>
                    <Select
                      value={claudeModel}
                      onChange={(e) => setClaudeModel(e.target.value)}
                      label="🤖 Claude модель"
                    >
                      <MenuItem value="claude-4-opus">🚀 Claude 4 Opus</MenuItem>
                      <MenuItem value="claude-4-sonnet">⚡ Claude 4 Sonnet</MenuItem>
                      <MenuItem value="claude-3.7-sonnet">💎 Claude 3.7 Sonnet</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl 
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'transparent',
                        '&:hover': {
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(239,68,68,0.15)'
                            : '0 4px 20px rgba(239,68,68,0.15)',
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        },
                      },
                    }}
                  >
                    <InputLabel>🚀 Grok модель</InputLabel>
                    <Select
                      value={grokModel}
                      onChange={(e) => setGrokModel(e.target.value)}
                      label="🚀 Grok модель"
                    >
                      <MenuItem value="grok-3">🚀 Grok 3</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 2,
                    borderRadius: '12px',
                    border: theme.palette.mode === 'dark'
                      ? '1px solid rgba(129,140,248,0.2)'
                      : '1px solid rgba(102,126,234,0.2)',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(192,132,252,0.1) 100%)'
                      : 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
                  }}
                >
                  <Typography variant="caption" sx={{ lineHeight: 1.4, fontSize: '0.75rem' }}>
                    💡 <strong>Мозговой штурм:</strong> Совместная генерация идей • 
                    ⚔️ <strong>Дебаты:</strong> Противоположные точки зрения • 
                    🔍 <strong>Анализ:</strong> Глубокий разбор • 
                    🎭 <strong>Творческий:</strong> Нестандартные подходы
                  </Typography>
                </Alert>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={() => setShowNewSession(false)}
                    sx={{
                      px: 3,
                      py: 1,
                      borderRadius: '12px',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.23)' : 'grey.300',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.4)' : 'grey.400',
                        background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={startMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <PlayArrow />}
                    onClick={handleStart}
                    disabled={!topic.trim() || startMutation.isPending}
                    sx={{
                      px: 4,
                      py: 1,
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: theme.palette.mode === 'dark'
                        ? '0 8px 32px rgba(129,140,248,0.3)'
                        : '0 8px 32px rgba(102,126,234,0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
                          : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 12px 40px rgba(129,140,248,0.4)'
                          : '0 12px 40px rgba(102,126,234,0.4)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: theme.palette.mode === 'dark'
                          ? 'linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(192,132,252,0.5) 100%)'
                          : 'linear-gradient(135deg, rgba(102,126,234,0.5) 0%, rgba(118,75,162,0.5) 100%)',
                        boxShadow: 'none',
                      },
                    }}
                  >
                  {startMutation.isPending ? 'Запуск...' : t('brainstorm.start')}
                </Button>
              </Box>
              </Box>
            </Paper>
          </Container>
        ) : (
          <BrainstormHistory onSelectSession={handleSelectSession} />
        )}
      </Box>
      </Box>
    </PageContainer>
  );
};

export default BrainstormPage;