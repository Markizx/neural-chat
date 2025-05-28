import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  AutoAwesome,
  PlayArrow,
  Pause,
  Stop,
  Download,
} from '@mui/icons-material';
import BrainstormSession from '../components/Brainstorm/BrainstormSession';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';

const BrainstormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [showNewSession, setShowNewSession] = useState(!id);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'brainstorm' | 'debate' | 'analysis' | 'creative'>('brainstorm');
  const [claudeModel, setClaudeModel] = useState('claude-4-opus');
  const [grokModel, setGrokModel] = useState('grok-3');

  // Fetch existing session
  const { data: session, isLoading } = useQuery({
    queryKey: ['brainstorm', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiService.get(`/brainstorm/${id}`);
      return response.data;
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
      setShowNewSession(false);
      window.history.pushState(null, '', `/brainstorm/${(data as any).session._id}`);
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

  if (showNewSession && !session) {
    return (
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

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
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
    );
  }

  return <BrainstormSession sessionId={id || (session as any)?._id} />;
};

export default BrainstormPage;