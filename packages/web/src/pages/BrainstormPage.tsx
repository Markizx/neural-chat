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
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';

const BrainstormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(id ? 1 : 0); // 0 = История, 1 = Сессия
  const [showNewSession, setShowNewSession] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'brainstorm' | 'debate' | 'analysis' | 'creative'>('brainstorm');
  const [claudeModel, setClaudeModel] = useState('claude-3.5-sonnet');
  const [grokModel, setGrokModel] = useState('grok-3');

  // Fetch existing session
  const { data: session, isLoading } = useQuery({
    queryKey: ['brainstorm', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiService.get(`/brainstorm/${id}`);
      return (response.data as any).data.session;
    },
    enabled: !!id,
  });

  // Start new session
  const startMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiService.post('/brainstorm/start', data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('🎉 Brainstorm session created:', data);
      console.log('📊 Data structure:', {
        hasData: !!(data as any).data,
        hasSession: !!(data as any).data?.session,
        sessionId: (data as any).data?.session?._id,
        fullData: data
      });
      
      setShowNewSession(false);
      
      // API возвращает {success: true, data: {chat, session}}
      const sessionId = (data as any).data?.session?._id || (data as any).session?._id;
      
      console.log('🔍 Extracted sessionId:', sessionId);
      
      if (sessionId) {
        console.log('🚀 Navigating to:', `/brainstorm/${sessionId}`);
        navigate(`/brainstorm/${sessionId}`);
      } else {
        console.error('❌ No session ID in response:', data);
        // Попробуем альтернативные пути
        const altSessionId = (data as any).chat?._id || 
                            (data as any).data?.chat?._id ||
                            (data as any).id ||
                            (data as any)._id;
        console.log('🔄 Trying alternative sessionId:', altSessionId);
        if (altSessionId) {
          navigate(`/brainstorm/${altSessionId}`);
        }
      }
    },
    onError: (error) => {
      console.error('❌ Failed to create brainstorm session:', error);
    },
  });

  const handleStart = () => {
    if (!topic.trim()) return;

    startMutation.mutate({
      topic,
      description,
      claudeModel,
      grokModel,
      settings: {
        format,
        maxTurns: 20,
        turnDuration: 60,
      },
    });
  };

  const handleSelectSession = (sessionId: string) => {
    navigate(`/brainstorm/${sessionId}`);
  };

  const handleNewSession = () => {
    setShowNewSession(true);
    setActiveTab(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 0 && id) {
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
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Tabs */}
        <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={1} onChange={handleTabChange}>
            <Tab label="История" />
            <Tab label="Текущая сессия" />
          </Tabs>
        </Paper>
        
        <Box sx={{ flex: 1 }}>
          <BrainstormSession sessionId={id} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            Brainstorm Sessions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewSession}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
              },
            }}
          >
            Новая сессия
          </Button>
        </Box>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {showNewSession ? (
          <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <AutoAwesome
                  sx={{
                    fontSize: 48,
                    color: 'primary.main',
                    mb: 2,
                  }}
                />
                <Typography variant="h4" gutterBottom>
                  Start a Brainstorm Session
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Let Claude and Grok collaborate on your ideas
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Topic"
                placeholder="What should the AIs discuss?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Description"
                placeholder="Provide more context or specific questions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                margin="normal"
                multiline
                rows={3}
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as any)}
                    label="Format"
                  >
                    <MenuItem value="brainstorm">Brainstorm</MenuItem>
                    <MenuItem value="debate">Debate</MenuItem>
                    <MenuItem value="analysis">Analysis</MenuItem>
                    <MenuItem value="creative">Creative</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Claude Model</InputLabel>
                  <Select
                    value={claudeModel}
                    onChange={(e) => setClaudeModel(e.target.value)}
                    label="Claude Model"
                  >
                    <MenuItem value="claude-4-opus">Claude 4 Opus</MenuItem>
                    <MenuItem value="claude-4-sonnet">Claude 4 Sonnet</MenuItem>
                    <MenuItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Grok Model</InputLabel>
                  <Select
                    value={grokModel}
                    onChange={(e) => setGrokModel(e.target.value)}
                    label="Grok Model"
                  >
                    <MenuItem value="grok-3">Grok 3</MenuItem>
                    <MenuItem value="grok-2">Grok 2</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Brainstorm:</strong> Collaborative idea generation
                  <br />
                  <strong>Debate:</strong> Opposing viewpoints and arguments
                  <br />
                  <strong>Analysis:</strong> Systematic breakdown of topics
                  <br />
                  <strong>Creative:</strong> Imaginative and unconventional approaches
                </Typography>
              </Alert>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => setShowNewSession(false)}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrow />}
                  onClick={handleStart}
                  disabled={!topic.trim() || startMutation.isPending}
                  sx={{
                    px: 4,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                    },
                  }}
                >
                  {startMutation.isPending ? 'Starting...' : 'Start Brainstorm'}
                </Button>
              </Box>
            </Paper>
          </Container>
        ) : (
          <BrainstormHistory onSelectSession={handleSelectSession} />
        )}
      </Box>
    </Box>
  );
};

export default BrainstormPage;