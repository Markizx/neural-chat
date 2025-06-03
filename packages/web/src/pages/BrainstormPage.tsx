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
      const response = await apiService.post('/brainstorm', {
        topic,
        description,
        settings: {
          format,
          claudeModel,
          grokModel,
          maxTurns: 20,
        },
      });
      return (response.data as any).data.sessionId;
    },
    onSuccess: (sessionId) => {
      navigate(`/brainstorm/${sessionId}`);
    },
  });

  const handleStart = () => {
    if (topic.trim()) {
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
        <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={1} onChange={handleTabChange}>
            <Tab label={t('brainstorm.history')} />
            <Tab label={t('brainstorm.currentSession')} />
          </Tabs>
        </Paper>
        
        <Box sx={{ flex: 1 }}>
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
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography 
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
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
          background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
        }}
      >
        {showNewSession ? (
          <Container maxWidth="md" sx={{ py: 6 }}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 6,
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 20% 80%, rgba(102,126,234,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(239,68,68,0.1) 0%, transparent 50%)',
                  zIndex: 0,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{ mb: 6, textAlign: 'center' }}>
                  {/* Animated icon container */}
                  <Box
                    sx={{
                      position: 'relative',
                      display: 'inline-block',
                      mb: 3,
                    }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(102,126,234,0.7)' },
                          '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(102,126,234,0)' },
                          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(102,126,234,0)' },
                        },
                      }}
                    >
                      <AutoAwesome
                        sx={{
                          fontSize: 48,
                          color: 'white',
                        }}
                      />
                    </Box>
                    
                    {/* Floating AI icons */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        animation: 'float 3s ease-in-out infinite',
                        '@keyframes float': {
                          '0%, 100%': { transform: 'translateY(0px)' },
                          '50%': { transform: 'translateY(-10px)' },
                        },
                      }}
                    >
                      🤖
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -10,
                        left: -10,
                        animation: 'float 3s ease-in-out infinite 1.5s',
                      }}
                    >
                      🚀
                    </Box>
                  </Box>

                  <Typography 
                    variant="h3" 
                    gutterBottom
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      mb: 2,
                    }}
                  >
                    Мозговой штурм с ИИ
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.6,
                      maxWidth: '500px',
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
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(102,126,234,0.15)',
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 20px rgba(102,126,234,0.25)',
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
                  rows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '16px',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(102,126,234,0.15)',
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 20px rgba(102,126,234,0.25)',
                      },
                    },
                  }}
                />

                <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                  <FormControl 
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(102,126,234,0.15)',
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
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(99,102,241,0.15)',
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
                        '&:hover': {
                          boxShadow: '0 4px 20px rgba(239,68,68,0.15)',
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
                      <MenuItem value="grok-2-image">🎨 Grok 2 Image</MenuItem>
                      <MenuItem value="grok-2-vision">👁️ Grok 2 Vision</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 4,
                    borderRadius: '16px',
                    border: '1px solid rgba(102,126,234,0.2)',
                    background: 'linear-gradient(135deg, rgba(102,126,234,0.05) 0%, rgba(118,75,162,0.05) 100%)',
                  }}
                >
                  <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                    💡 <strong>Мозговой штурм:</strong> Совместная генерация креативных идей
                    <br />
                    ⚔️ <strong>Дебаты:</strong> Противоположные точки зрения и аргументы
                    <br />
                    🔍 <strong>Анализ:</strong> Систематический и глубокий разбор
                    <br />
                    🎭 <strong>Творческий:</strong> Воображение и нестандартные подходы
                  </Typography>
                </Alert>

                <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', gap: 3 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => setShowNewSession(false)}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: '16px',
                      borderColor: 'grey.300',
                      color: 'text.secondary',
                      '&:hover': {
                        borderColor: 'grey.400',
                        background: 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={startMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={handleStart}
                    disabled={!topic.trim() || startMutation.isPending}
                    sx={{
                      px: 6,
                      py: 1.5,
                      borderRadius: '16px',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                        boxShadow: '0 12px 40px rgba(102,126,234,0.4)',
                        transform: 'translateY(-2px)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, rgba(102,126,234,0.5) 0%, rgba(118,75,162,0.5) 100%)',
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