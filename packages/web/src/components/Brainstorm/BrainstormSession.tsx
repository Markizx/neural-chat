import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  TextField,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Download,
  Send,
  Psychology,
  SmartToy,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import BrainstormMessage from './BrainstormMessage';
import BrainstormControls from './BrainstormControls';

interface BrainstormSessionProps {
  sessionId: string;
}

const BrainstormSession: React.FC<BrainstormSessionProps> = ({ sessionId }) => {
  const [userInput, setUserInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();

  // Fetch session data
  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['brainstorm', sessionId],
    queryFn: async () => {
      const response = await apiService.get(`/brainstorm/${sessionId}`);
      return response.data;
    },
    enabled: !!sessionId,
  });

  // Type assertion for session
  const typedSession = session as any;

  // WebSocket setup
  useEffect(() => {
    if (sessionId && socket) {
      socket.emit('brainstorm:join', sessionId);

      socket.on('brainstorm:message', (data) => {
        if (data.sessionId === sessionId) {
          refetch();
        }
      });

      return () => {
        socket.emit('brainstorm:leave', sessionId);
        socket.off('brainstorm:message');
      };
    }
  }, [sessionId, socket, refetch]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [typedSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiService.post(`/brainstorm/${sessionId}/message`, { content });
    },
    onSuccess: () => {
      setUserInput('');
      refetch();
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/pause`);
    },
    onSuccess: () => {
      setIsPlaying(false);
      refetch();
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/resume`);
    },
    onSuccess: () => {
      setIsPlaying(true);
      refetch();
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/stop`);
    },
    onSuccess: () => {
      setIsPlaying(false);
      refetch();
    },
  });

  const handleSendMessage = () => {
    if (userInput.trim()) {
      sendMessageMutation.mutate(userInput.trim());
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiService.get(`/brainstorm/${sessionId}/export?format=markdown`);
      const blob = new Blob([response.data as string], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainstorm-${typedSession?.topic}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!typedSession) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Session not found</Alert>
      </Box>
    );
  }

  const progress = (typedSession.currentTurn / typedSession.settings.maxTurns) * 100;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              {typedSession.topic}
            </Typography>
            {typedSession.description && (
              <Typography variant="body2" color="text.secondary">
                {typedSession.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<SmartToy />}
              label={typedSession.participants.claude.model}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<Psychology />}
              label={typedSession.participants.grok.model}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Progress */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Turn {typedSession.currentTurn} / {typedSession.settings.maxTurns}
            </Typography>
            <Typography variant="body2">
              Status: {typedSession.status}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              },
            }}
          />
        </Box>
      </Paper>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {typedSession.messages.map((message, index) => (
          <BrainstormMessage key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Controls */}
      <BrainstormControls
        status={typedSession.status}
        onPause={() => pauseMutation.mutate()}
        onResume={() => resumeMutation.mutate()}
        onStop={() => stopMutation.mutate()}
        onExport={handleExport}
        isLoading={
          pauseMutation.isPending ||
          resumeMutation.isPending ||
          stopMutation.isPending
        }
      />

      {/* User input */}
      {typedSession.status !== 'completed' && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Add your input to guide the discussion..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={sendMessageMutation.isPending}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={!userInput.trim() || sendMessageMutation.isPending}
              endIcon={sendMessageMutation.isPending ? <CircularProgress size={20} /> : <Send />}
            >
              Send
            </Button>
          </Box>
        </Paper>
      )}

      {/* Summary (if completed) */}
      {typedSession.status === 'completed' && typedSession.summary && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            m: 2,
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Typography variant="body2" paragraph>
            {typedSession.summary}
          </Typography>
          
          {typedSession.insights && typedSession.insights.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Key Insights
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {typedSession.insights.map((insight, index) => (
                  <li key={index}>
                    <Typography variant="body2">{insight}</Typography>
                  </li>
                ))}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default BrainstormSession;