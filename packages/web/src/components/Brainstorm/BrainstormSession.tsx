import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Psychology,
  KeyboardArrowDown,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileUploadRef = useRef<any>(null);
  const { socket } = useWebSocket();
  const [attachments, setAttachments] = useState<{
    id: string;
    name: string;
    type: 'image' | 'document' | 'code' | 'other';
    size: number;
    data: string;
    mimeType: string;
  }[]>([]);
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
      
      const sessionData = responseData.session;
      

      
      setSession(sessionData);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Error in refetch:', err);
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
    if (!socket || !sessionId) return;

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
          // eslint-disable-next-line no-console
          console.log('✅ Stream completed for:', data.speaker, data.messageId, 'Message:', data.message);
          setStreamingMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.messageId);
            return newMap;
          });
          // Обновляем сессию с новым сообщением
          setTimeout(() => {
            // eslint-disable-next-line no-console
            console.log('🔄 Refetching after streamComplete for:', data.speaker);
            refetch();
          }, 1000); // Увеличиваем задержку для БД
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
          // eslint-disable-next-line no-console
          console.log('🔄 WebSocket message received, refetching session...', data);
          refetch();
        }
      });

      socket.on('error', (error) => {
        // eslint-disable-next-line no-console
        console.error('❌ WebSocket error:', error);
      });
      
      socket.on('brainstorm:joined', (data) => {
        // eslint-disable-next-line no-console
        console.log('✅ Successfully joined brainstorm room:', data);
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
  }, [sessionId, socket, refetch]); // Убираем session из зависимостей

  // Мемоизируем список сообщений для предотвращения лишних перерендеров
  const renderedMessages = useMemo(() => {
    if (!session?.messages) return [];
    
    return session.messages.map((message: any, index: number) => {
      const messageId = message._id || message.id || `msg-${index}`;
      const streamingData = streamingMessages.get(messageId);
      const isStreaming = streamingData?.isStreaming || false;
      
      return (
        <BrainstormMessage
          key={messageId}
          message={{
            id: messageId,
            speaker: message.speaker,
            content: message.content,
            timestamp: message.timestamp,
            tokens: message.tokens,
            isStreaming: isStreaming,
            attachments: message.attachments || []
          }}
          isStreaming={isStreaming}
        />
      );
    });
  }, [session?.messages, streamingMessages]);

  // Мемоизируем streaming сообщение
  const streamingMessage = useMemo(() => {
    if (streamingMessages.size === 0) return null;
    
    const firstStreamingMessage = streamingMessages.values().next().value;
    return (
      <BrainstormMessage
        message={{
          id: firstStreamingMessage.id,
          speaker: firstStreamingMessage.speaker,
          content: firstStreamingMessage.content,
          timestamp: new Date().toISOString(),
        }}
        isStreaming={true}
      />
    );
  }, [streamingMessages]);

  const [autoScroll, setAutoScroll] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = useCallback(() => {
    if (!autoScroll) return;
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  }, [autoScroll]);

  // Отслеживаем скролл пользователя
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // Автоматически включаем автоскролл если пользователь в конце
    if (isNearBottom && !autoScroll) {
      setAutoScroll(true);
    }
    // Отключаем автоскролл если пользователь скроллит вверх
    else if (!isNearBottom && autoScroll) {
      setAutoScroll(false);
    }
  }, [autoScroll]);

  // Auto-scroll to bottom only when autoScroll is enabled
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [session?.messages, streamingMessages, scrollToBottom, autoScroll]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // eslint-disable-next-line no-console
      console.log('🚀 Отправка сообщения:', {
        content,
        attachmentsCount: attachments.length,
        attachmentsState: attachments
      });
      
      // eslint-disable-next-line no-console
      console.log('🔍 Состояние attachments перед отправкой:', attachments.map((a, i) => ({
        index: i,
        name: a?.name,
        type: a?.type,
        mimeType: a?.mimeType,
        hasData: !!a?.data,
        objectKeys: Object.keys(a || {})
      })));
      
      // Файлы уже обработаны в handleFilesChange
      const processedAttachments = attachments;
      
      const payload = {
        content: content || '', // Убеждаемся что content не undefined
        attachments: processedAttachments
      };
      
      // eslint-disable-next-line no-console
      console.log('🚀 Отправляем полный payload:', {
        content: payload.content,
        attachmentsCount: payload.attachments.length,
        attachments: payload.attachments
      });
      
      // eslint-disable-next-line no-console  
      console.log('🔍 Проверка каждого attachment:', payload.attachments.map((a, i) => ({
        index: i,
        hasName: !!a.name,
        hasData: !!a.data,
        hasMimeType: !!a.mimeType,
        keys: Object.keys(a),
        fullObject: a
      })));
      
      return apiService.post(`/brainstorm/${sessionId}/message`, payload);
    },
    onSuccess: (response) => {
      // eslint-disable-next-line no-console
      console.log('✅ Message sent successfully:', response);
      setUserInput('');
      setAttachments([]);
      // Очищаем файлы в FileUpload компоненте
      fileUploadRef.current?.clearFiles?.();
      // Немедленно обновляем локальное состояние и потом refetch
      refetch();
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.error('❌ Error sending brainstorm message:', error);
    },
  });

  const continueDiscussionMutation = useMutation({
    mutationFn: async () => {
      return apiService.post(`/brainstorm/${sessionId}/continue`);
    },
    onSuccess: () => {
      // eslint-disable-next-line no-console
      console.log('✅ AI discussion continued successfully');
      // Рефетч произойдет автоматически через WebSocket events
    },
    onError: (error: any) => {
      // eslint-disable-next-line no-console
      console.error('❌ Error continuing AI discussion:', error);
    }
  });

  const handleSendMessage = () => {
    if (userInput.trim() || attachments.length > 0) {
      sendMessageMutation.mutate(userInput.trim() || ''); // Разрешаем пустой текст если есть файлы
    }
  };

  const handleContinueDiscussion = () => {
    continueDiscussionMutation.mutate();
  };

  const handleFilesChange = async (files: File[]) => {
    // eslint-disable-next-line no-console
    console.log('📁 Файлы выбраны:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Обрабатываем файлы сразу при выборе
    if (files.length > 0) {
      try {
        const processedAttachments = await Promise.all(
          files.map(async (file) => {
            return new Promise<{
              id: string;
              name: string;
              type: 'image' | 'document' | 'code' | 'other';
              size: number;
              data: string;
              mimeType: string;
            }>((resolve) => {
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
                          file.name.endsWith('.c') || file.name.endsWith('.cpp') || file.name.endsWith('.json') ||
                          file.name.endsWith('.md')) {
                  type = 'code';
                }
                
                // Определяем MIME тип с fallback для файлов без типа
                let mimeType = file.type;
                if (!mimeType || mimeType.trim() === '') {
                  // Fallback на основе расширения файла
                  const extension = file.name.toLowerCase().split('.').pop();
                  switch (extension) {
                    case 'md': mimeType = 'text/markdown'; break;
                    case 'txt': mimeType = 'text/plain'; break;
                    case 'json': mimeType = 'application/json'; break;
                    case 'js': mimeType = 'application/javascript'; break;
                    case 'ts': mimeType = 'application/typescript'; break;
                    case 'py': mimeType = 'text/x-python'; break;
                    case 'java': mimeType = 'text/x-java-source'; break;
                    case 'cpp': case 'c': mimeType = 'text/x-c'; break;
                    case 'html': mimeType = 'text/html'; break;
                    case 'css': mimeType = 'text/css'; break;
                    case 'xml': mimeType = 'application/xml'; break;
                    case 'yaml': case 'yml': mimeType = 'application/x-yaml'; break;
                    default: mimeType = 'application/octet-stream'; break;
                  }
                }
                
                resolve({
                  id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  name: file.name,
                  type: type,
                  size: file.size,
                  data: reader.result as string,
                  mimeType: mimeType
                });
              };
              reader.readAsDataURL(file);
            });
          })
        );
        
        // eslint-disable-next-line no-console
        console.log('✅ Файлы обработаны:', processedAttachments.map(a => ({
          name: a.name,
          type: a.type,
          mimeType: a.mimeType,
          dataLength: a.data?.length || 0,
          hasRequiredFields: !!(a.name && a.data && a.mimeType)
        })));
        
        // eslint-disable-next-line no-console
        console.log('🔍 Проверка полного объекта:', processedAttachments);
        
        setAttachments(processedAttachments);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Ошибка обработки файлов:', error);
      }
    } else {
      setAttachments([]);
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

  return (
    <Box
      sx={{
        height: '100%',
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
              🧠 {session?.topic || 'Мозговой штурм'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Claude vs Grok • {session?.settings?.format || 'brainstorm'}
              {session?.description && ` • ${session.description}`}
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
          position: 'relative', // Для абсолютного позиционирования кнопки
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
                Начните дискуссию!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Напишите сообщение, и Claude с Grok начнут обсуждение
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            ref={messagesContainerRef}
            onScroll={handleScroll}
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
            {renderedMessages}
            
            {streamingMessage}
            <div ref={messagesEndRef} />
          </Box>
        )}
        
        {/* Плавающая кнопка автоскролла */}
        {!autoScroll && session?.messages?.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setAutoScroll(true);
                scrollToBottom();
              }}
              sx={{
                minWidth: 'auto',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 20px rgba(102,126,234,0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
                  boxShadow: '0 8px 25px rgba(102,126,234,0.4)',
                },
              }}
            >
              <KeyboardArrowDown />
            </Button>
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
        {/* Превью прикрепленных файлов */}
        {attachments.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Прикрепленные файлы ({attachments.length}):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {attachments.map((file, index) => (
                <Chip
                  key={index}
                  label={`${file.name} (${Math.round(file.size / 1024)}KB)`}
                  onDelete={() => {
                    const newAttachments = attachments.filter((_, i) => i !== index);
                    setAttachments(newAttachments);
                  }}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ maxWidth: '200px' }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <FileUpload
            ref={fileUploadRef}
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
            placeholder={session?.messages?.length === 0 ? "Начните дискуссию по теме..." : "Продолжите дискуссию или задайте новый вопрос..."}
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
          
          {/* Кнопка продолжить дискуссию (показывается только если есть сообщения) */}
          {session?.messages?.length > 0 && (
            <Button
              variant="outlined"
              onClick={handleContinueDiscussion}
              disabled={isLoading || streamingMessages.size > 0 || continueDiscussionMutation.isPending}
              sx={{
                minWidth: '140px',
                height: '56px',
                borderRadius: '28px',
                border: `2px solid ${theme.palette.primary.main}`,
                color: 'primary.main',
                background: theme.palette.mode === 'dark'
                  ? 'rgba(102,126,234,0.1)'
                  : 'rgba(102,126,234,0.05)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'rgba(102,126,234,0.2)'
                    : 'rgba(102,126,234,0.1)',
                  border: `2px solid ${theme.palette.primary.main}`,
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  color: alpha(theme.palette.primary.main, 0.5),
                },
              }}
            >
              {continueDiscussionMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <Psychology sx={{ mr: 1, fontSize: 20 }} />
                  Продолжить
                </>
              )}
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={(!userInput.trim() && attachments.length === 0) || isLoading || streamingMessages.size > 0}
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