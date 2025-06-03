import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Send,
  AutoAwesome,
  MoreVert,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import BrainstormMessage from './BrainstormMessage';
import FileUpload from '../Chat/FileUpload';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

interface BrainstormSessionProps {
  sessionId: string;
}

const BrainstormSession: React.FC<BrainstormSessionProps> = ({ sessionId }) => {
  const [userInput, setUserInput] = useState('');
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [streamingMessages, setStreamingMessages] = useState<Map<string, any>>(new Map());
  const theme = useTheme();

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
        
        const response = await apiService.get(`/brainstorm/${sessionId}`);
        
        if (!isMounted) return;
        
        const responseData = response.data as any;
        
        if (!responseData || !responseData.session) {
          throw new Error('Invalid session response structure');
        }
        
        const sessionData = responseData.session;
        setSession(sessionData);
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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
      socket.emit('brainstorm:join', sessionId);

      // Обработка начала streaming
      socket.on('brainstorm:streamStart', (data) => {
        if (data.sessionId === sessionId) {
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
          setError(data.error);
        }
      });

      socket.on('brainstorm:message', (data) => {
        if (data.sessionId === sessionId) {
          refetch();
        }
      });

      socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  }, []);

  // Auto-scroll to bottom when messages or streaming messages change
  useEffect(() => {
    scrollToBottom();
  }, [session?.messages, streamingMessages, scrollToBottom]);

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
      // eslint-disable-next-line no-console
      console.error('❌ Error sending brainstorm message:', error);
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

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      }}
    >
      {/* Header - фиксированная высота */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderBottom: 1,
          borderColor: 'divider',
          background: theme.palette.mode === 'dark'
            ? 'rgba(26, 26, 46, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          minHeight: { xs: '60px', md: '70px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(102,126,234,0.7)' },
                '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(102,126,234,0)' },
              },
            }}
          >
            <AutoAwesome sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              🧠 Мозговой штурм
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Claude vs Grok • {session?.settings?.format || 'brainstorm'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${session.messages?.length || 0} сообщений`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages Area - растягивается */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: { xs: 1, md: 2 },
          py: 1,
        }}
      >
        {session?.messages?.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              p: 4,
            }}
          >
            <Box>
              <Box
                sx={{
                  fontSize: '64px',
                  mb: 2,
                  animation: 'float 3s ease-in-out infinite',
                  '@keyframes float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                  },
                }}
              >
                🤖⚡🧠
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Готов к мозговому штурму!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Claude и Grok готовы обсудить вашу тему
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            ref={messagesEndRef}
            sx={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.text.secondary, 0.3),
                borderRadius: '3px',
                '&:hover': {
                  background: alpha(theme.palette.text.secondary, 0.5),
                },
              },
            }}
          >
            {session?.messages?.map((message: any) => (
              <BrainstormMessage
                key={message._id}
                message={message}
                isStreaming={streamingMessages.get(message._id)?.isStreaming}
              />
            ))}
            
            {streamingMessages.size > 0 && (
              <BrainstormMessage
                message={{
                  id: streamingMessages.values().next().value.id,
                  speaker: streamingMessages.values().next().value.speaker,
                  content: streamingMessages.values().next().value.content,
                  timestamp: new Date().toISOString(),
                }}
                isStreaming={true}
              />
            )}
          </Box>
        )}
      </Box>

      {/* Input Area - фиксированная высота */}
      <Box
        sx={{
          p: { xs: 1, md: 2 },
          borderTop: 1,
          borderColor: 'divider',
          background: theme.palette.mode === 'dark'
            ? 'rgba(26, 26, 46, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          minHeight: { xs: '80px', md: '100px' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <FileUpload
            onFilesChange={handleFilesChange}
            maxFiles={3}
            maxFileSize={5}
            disabled={sendMessageMutation.isPending}
            acceptedFileTypes={[
              'image/*',
              'text/*',
              'application/json',
              'application/javascript',
              'application/typescript',
              '.js',
              '.ts',
              '.jsx',
              '.tsx',
              '.py',
              '.java',
              '.c',
              '.cpp',
              '.md',
              '.txt',
              '.csv',
              '.xml',
              '.yaml',
              '.yml'
            ]}
            helperText="📎 Поддерживаются: изображения, код, документы • Claude видит все • Grok автоматически переключается на vision для изображений"
          />
          
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Продолжите дискуссию или задайте новый вопрос..."
            disabled={isLoading || streamingMessages.size > 0}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                background: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.8)',
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(102,126,234,0.15)',
                },
                '&.Mui-focused': {
                  boxShadow: '0 4px 20px rgba(102,126,234,0.25)',
                },
              },
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading || streamingMessages.size > 0}
            sx={{
              minWidth: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(102,126,234,0.3)',
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
            {isLoading || streamingMessages.size > 0 ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <Send />
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default BrainstormSession;