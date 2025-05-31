import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Send,
  Psychology,
  SmartToy,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import BrainstormMessage from './BrainstormMessage';
import BrainstormControls from './BrainstormControls';
import FileUpload from '../Chat/FileUpload';

interface BrainstormSessionProps {
  sessionId: string;
}

const BrainstormSession: React.FC<BrainstormSessionProps> = ({ sessionId }) => {
  // eslint-disable-next-line no-console
  console.log('🔄 BrainstormSession component mounted with sessionId:', sessionId);
  
  const [userInput, setUserInput] = useState('');
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<Map<string, any>>(new Map());

  // Оборачиваем refetch в useCallback
  const refetch = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      setError(null);
      
      const response = await apiService.get(`/brainstorm/${sessionId}`);
      const responseData = response.data as any;
      
      if (!responseData || !responseData.session) {
        throw new Error('Invalid session response structure');
      }
      
      setSession(responseData.session);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error refetching session:', errorMessage);
      setError(errorMessage);
    }
  }, [sessionId]);

  // Простая загрузка данных без React Query
  useEffect(() => {
    let isMounted = true;
    
    const fetchSession = async () => {
      if (!sessionId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // eslint-disable-next-line no-console
        console.log('🔍 Fetching brainstorm session:', sessionId);
        const response = await apiService.get(`/brainstorm/${sessionId}`);
        
        if (!isMounted) return;
        
        // eslint-disable-next-line no-console
        console.log('📥 Full API response:', response);
        
        // API возвращает {session: {...}} напрямую
        const responseData = response.data as any;
        
        // eslint-disable-next-line no-console
        console.log('📊 Response structure check:', {
          hasData: !!responseData,
          hasSession: !!(responseData && responseData.session),
          responseDataType: typeof responseData,
          responseDataKeys: responseData ? Object.keys(responseData) : 'no data',
          actualResponseData: responseData
        });
        
        // eslint-disable-next-line no-console
        console.log('🔍 Detailed response data:', JSON.stringify(responseData, null, 2));
        
        if (!responseData || !responseData.session) {
          // eslint-disable-next-line no-console
          console.error('❌ Invalid response structure:', responseData);
          throw new Error('Invalid session response structure');
        }
        
        const sessionData = responseData.session;
        
        // eslint-disable-next-line no-console
        console.log('✅ Session loaded successfully:', {
          id: sessionData._id,
          topic: sessionData.topic,
          status: sessionData.status,
          currentTurn: sessionData.currentTurn,
          maxTurns: sessionData.settings?.maxTurns,
          messagesCount: sessionData.messages?.length || 0,
          messages: sessionData.messages?.map((m: any) => ({ speaker: m.speaker, content: m.content.substring(0, 50) + '...' }))
        });
        
        setSession(sessionData);
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        // eslint-disable-next-line no-console
        console.error('❌ Error loading session:', errorMessage);
        setError(errorMessage);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSession();
    
    return () => {
      isMounted = false;
    };
  }, [sessionId]); // Только sessionId в зависимостях

  // WebSocket setup для streaming - отдельный useEffect
  useEffect(() => {
    if (!socket || !sessionId || !session) return;

    const timer = setTimeout(() => {
      // eslint-disable-next-line no-console
      console.log('🔗 Setting up WebSocket for session:', sessionId);
      
      // eslint-disable-next-line no-console
      console.log('🚀 Emitting brainstorm:join with sessionId:', sessionId);
      socket.emit('brainstorm:join', sessionId);

      // Обработка начала streaming
      socket.on('brainstorm:streamStart', (data) => {
        if (data.sessionId === sessionId) {
          console.log('📝 Stream started:', data);
          setStreamingMessages(prev => {
            const newMap = new Map(prev);
            newMap.set(data.messageId, {
              id: data.messageId,
              speaker: data.speaker,
              content: '',
              timestamp: new Date().toISOString(),
              isStreaming: true
            });
            return newMap;
          });
        }
      });

      // Обработка chunks
      socket.on('brainstorm:streamChunk', (data) => {
        if (data.sessionId === sessionId) {
          setStreamingMessages(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(data.messageId);
            if (existing) {
              newMap.set(data.messageId, {
                ...existing,
                content: existing.content + data.content
              });
            }
            return newMap;
          });
        }
      });

      // Обработка завершения streaming
      socket.on('brainstorm:streamComplete', (data) => {
        if (data.sessionId === sessionId) {
          console.log('✅ Stream completed:', data);
          setStreamingMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.messageId);
            return newMap;
          });
          // Обновляем сессию с новым сообщением
          refetch();
        }
      });

      // Обработка ошибок
      socket.on('brainstorm:error', (data) => {
        if (data.sessionId === sessionId) {
          console.error('❌ Brainstorm error:', data);
          setError(data.error);
        }
      });

      socket.on('brainstorm:message', (data) => {
        // eslint-disable-next-line no-console
        console.log('📨 New brainstorm message received:', data);
        if (data.sessionId === sessionId) {
          refetch();
        }
      });

      socket.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('❌ WebSocket error:', error);
      });

      socket.on('brainstorm:joined', (data) => {
        // eslint-disable-next-line no-console
        console.log('✅ Successfully joined brainstorm:', data);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      socket.emit('brainstorm:leave', sessionId);
      socket.off('brainstorm:message');
      socket.off('brainstorm:streamStart');
      socket.off('brainstorm:streamChunk');
      socket.off('brainstorm:streamComplete');
      socket.off('brainstorm:error');
      socket.off('error');
      socket.off('brainstorm:joined');
    };
  }, [sessionId, socket, session, refetch]); // Добавляем refetch в зависимости

  // Auto-scroll to bottom when messages or streaming messages change
  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, streamingMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Если есть файлы, конвертируем их в base64
      const processedAttachments = await Promise.all(
        attachments.map(async (file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              // Определяем тип для совместимости с Message model enum
              let type: 'image' | 'document' | 'code' | 'other' = 'other';
              
              if (file.type.startsWith('image/')) {
                type = 'image';
              } else if (file.type.includes('pdf') || file.type.includes('doc') || file.type.includes('text')) {
                type = 'document';
              } else if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.jsx') || 
                        file.name.endsWith('.tsx') || file.name.endsWith('.py') || file.name.endsWith('.java') ||
                        file.name.endsWith('.c') || file.name.endsWith('.cpp') || file.name.endsWith('.json')) {
                type = 'code';
              }
              
              resolve({
                name: file.name,
                type: type, // Используем enum значение
                size: file.size,
                data: reader.result as string,
                mimeType: file.type
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      // Отправляем как JSON
      console.log('📤 Sending brainstorm message:', {
        content: content || '',
        attachments: processedAttachments.map((a: any) => ({ 
          name: a.name, 
          type: a.type, 
          size: a.size,
          mimeType: a.mimeType 
        }))
      });
      
      return apiService.post(`/brainstorm/${sessionId}/message`, {
        content: content || '', // Убеждаемся что content не undefined
        attachments: processedAttachments
      });
    },
    onSuccess: () => {
      setUserInput('');
      setAttachments([]);
      setTimeout(() => refetch(), 500);
    },
    onError: (error: any) => {
      console.error('❌ Error sending brainstorm message:', error);
      console.log('Error details:', error.response?.data);
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/pause`);
    },
    onSuccess: () => {
      setTimeout(() => refetch(), 500);
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/resume`);
    },
    onSuccess: () => {
      setTimeout(() => refetch(), 500);
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/stop`);
    },
    onSuccess: () => {
      setTimeout(() => refetch(), 500);
    },
  });

  const handleSendMessage = () => {
    if (userInput.trim() || attachments.length > 0) {
      sendMessageMutation.mutate(userInput.trim());
    }
  };

  const handleFilesChange = (files: File[]) => {
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleExport = async () => {
    try {
      const response = await apiService.get(`/brainstorm/${sessionId}/export?format=markdown`);
      const blob = new Blob([response.data as string], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brainstorm-${session?.topic}-${Date.now()}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // Export failed silently
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Error loading session: {error}
        </Alert>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Session not found</Alert>
      </Box>
    );
  }

  // Safe access to settings with defaults
  const maxTurns = session.settings?.maxTurns || 10;
  const currentTurn = session.currentTurn || 0;
  const progress = (currentTurn / maxTurns) * 100;

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
              {session.topic}
            </Typography>
            {session.description && (
              <Typography variant="body2" color="text.secondary">
                {session.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              onClick={() => refetch()}
              disabled={isLoading}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              🔄
            </Button>
            <Chip
              icon={<SmartToy />}
              label={session.participants?.claude?.model || 'Claude'}
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<Psychology />}
              label={session.participants?.grok?.model || 'Grok'}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Progress */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2">
              Turn {currentTurn} / {maxTurns}
            </Typography>
            <Typography variant="body2">
              Status: {session.status}
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
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: 'calc(100vh - 400px)', // Ограничиваем максимальную высоту
          p: 3,
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.1)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '3px',
            '&:hover': {
              background: 'rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}>
          {session.messages?.map((message, index) => (
            <BrainstormMessage key={index} message={message} />
          )) || []}
          
          {/* Отображаем streaming сообщения */}
          {Array.from(streamingMessages.values()).map((streamingMsg) => (
            <BrainstormMessage 
              key={streamingMsg.id} 
              message={streamingMsg}
              isStreaming={true}
            />
          ))}
          
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Controls */}
      <BrainstormControls
        status={session.status}
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
      {session.status !== 'completed' && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            borderRadius: 0,
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'background.paper',
            zIndex: 10
          }}
        >
          {/* Attachments */}
          {attachments.length > 0 && (
            <Box sx={{ 
              mb: 1.5, 
              display: 'flex', 
              gap: 0.5, 
              flexWrap: 'wrap',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              {attachments.map((file, index) => (
                <Chip
                  key={index}
                  label={file.name}
                  onDelete={() => removeAttachment(index)}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <FileUpload
              onFilesChange={handleFilesChange}
              maxFiles={3}
              maxFileSize={5}
              disabled={sendMessageMutation.isPending}
            />
            
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: '48px'
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={(!userInput.trim() && attachments.length === 0) || sendMessageMutation.isPending}
              endIcon={sendMessageMutation.isPending ? <CircularProgress size={20} /> : <Send />}
              sx={{
                minHeight: '48px',
                minWidth: '80px'
              }}
            >
              Send
            </Button>
          </Box>
        </Paper>
      )}

      {/* Summary (if completed) */}
      {session.status === 'completed' && session.summary && (
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
            {session.summary}
          </Typography>
          
          {session.insights && session.insights.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Key Insights
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {session.insights.map((insight, index) => (
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