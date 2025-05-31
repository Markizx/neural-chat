import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Settings,
  Download,
  Share,
  Psychology,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiService } from '../../services/api.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import EmptyState from './EmptyState';

interface ChatProps {
  chatId: string;
  isMobile?: boolean;
}

const Chat: React.FC<ChatProps> = ({ chatId, isMobile = false }) => {
  const [streamingMessage, setStreamingMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { socket } = useWebSocket();
  const queryClient = useQueryClient();

  // Загружаем чат
  const { data: chatData, isLoading } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      const response = await apiService.get(`/chats/${chatId}`);
      return response.data;
    },
    refetchOnWindowFocus: false,
  });

  // Загружаем сообщения
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const response = await apiService.get(`/chats/${chatId}/messages`);
      return response.data;
    },
    enabled: !!chatId,
    refetchOnWindowFocus: false,
  });

  const messages = (messagesData as any)?.messages || [];
  const chat = (chatData as any)?.chat;

  // WebSocket для real-time обновлений
  useEffect(() => {
    if (!socket || !chatId) return;

    // Присоединяемся к комнате чата
    socket.emit('chat:join', chatId);

    // Обработка начала streaming
    socket.on('message:streamStart', (data) => {
      if (data.chatId === chatId) {
        console.log('📝 Stream started for message:', data.messageId);
        setStreamingMessage({
          id: data.messageId,
          role: 'assistant',
          content: '',
          model: data.model,
          isStreaming: true,
          createdAt: new Date(),
        });
      }
    });

    // Обработка chunks
    socket.on('message:streamChunk', (data) => {
      if (data.chatId === chatId) {
        setStreamingMessage((prev: any) => {
          if (prev && prev.id === data.messageId) {
            return {
              ...prev,
              content: prev.content + data.content,
            };
          }
          return prev;
        });
      }
    });

    // Обработка завершения streaming
    socket.on('message:streamComplete', (data) => {
      if (data.chatId === chatId) {
        console.log('✅ Stream completed for message:', data.messageId);
        setStreamingMessage(null);
        // Обновляем сообщения после завершения streaming
        setTimeout(() => {
          refetchMessages();
        }, 500);
      }
    });

    // Обработка новых сообщений
    socket.on('message:created', (data) => {
      if (data.chatId === chatId) {
        refetchMessages();
      }
    });

    // Обработка ошибок streaming
    socket.on('message:streamError', (data) => {
      if (data.chatId === chatId) {
        console.error('❌ Stream error:', data.error);
        setStreamingMessage(null);
      }
    });

    return () => {
      socket.emit('chat:leave', chatId);
      socket.off('message:streamStart');
      socket.off('message:streamChunk');
      socket.off('message:streamComplete');
      socket.off('message:created');
      socket.off('message:streamError');
    };
  }, [socket, chatId, refetchMessages]);

  // Auto-scroll при новых сообщениях или streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Отправка сообщения с поддержкой streaming
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, attachments }: { content: string; attachments?: any[] }) => {
      const response = await apiService.post(`/chats/${chatId}/messages`, {
        content,
        attachments: attachments || [],
      });
      return response.data;
    },
    onSuccess: () => {
      // Сообщения будут обновлены через WebSocket
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
    },
  });

  // Мутации для действий с сообщениями
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: string; content: string }) => {
      const response = await apiService.put(`/messages/${messageId}`, { content });
      return response.data;
    },
    onSuccess: () => {
      refetchMessages();
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiService.delete(`/messages/${messageId}`);
      return response.data;
    },
    onSuccess: () => {
      refetchMessages();
    },
  });

  const regenerateMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiService.post(`/messages/${messageId}/regenerate`);
      return response.data;
    },
    onSuccess: () => {
      refetchMessages();
    },
  });

  const handleSendMessage = (content: string, attachments?: File[]) => {
    sendMessageMutation.mutate({ content, attachments });
  };

  const handleEditMessage = (messageId: string, content: string) => {
    editMessageMutation.mutate({ messageId, content });
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate(messageId);
  };

  const handleRegenerateMessage = (messageId: string) => {
    regenerateMessageMutation.mutate(messageId);
  };

  const getModelIcon = () => {
    if (chat?.type === 'claude') return '🤖';
    if (chat?.type === 'grok') return <Psychology />;
    return '💬';
  };

  const getModelColor = () => {
    if (chat?.type === 'claude') return 'primary';
    if (chat?.type === 'grok') return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <Typography>Loading chat...</Typography>
      </Box>
    );
  }

  if (!chat) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%' 
      }}>
        <Typography>Chat not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    }}>
      {/* Chat Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
          background: theme.palette.mode === 'dark'
            ? alpha('#1e1e2e', 0.8)
            : alpha('#ffffff', 0.9),
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: 2,
              background: theme.palette.mode === 'dark'
                ? alpha('#6366f1', 0.15)
                : alpha('#6366f1', 0.08),
              border: `1px solid ${alpha('#6366f1', 0.2)}`,
            }}>
              {getModelIcon()}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {chat.title || `${chat.type?.charAt(0).toUpperCase() + chat.type?.slice(1)} Chat`}
              </Typography>
            </Box>
            <Chip
              label={chat.model || chat.type}
              color={getModelColor() as any}
              variant="outlined"
              size="small"
              sx={{
                background: theme.palette.mode === 'dark'
                  ? alpha(theme.palette[getModelColor() as 'primary' | 'secondary'].main, 0.1)
                  : alpha(theme.palette[getModelColor() as 'primary' | 'secondary'].main, 0.05),
              }}
            />
            {chat.lastActivity && (
              <Typography variant="caption" color="text.secondary">
                Last activity: {format(new Date(chat.lastActivity), 'MMM d, HH:mm')}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small">
              <Settings />
            </IconButton>
            <IconButton size="small">
              <Download />
            </IconButton>
            <IconButton size="small">
              <Share />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        position: 'relative',
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
      }}>
        {messages.length === 0 && !streamingMessage ? (
          <EmptyState 
            title={`Start chatting with ${chat.type?.charAt(0).toUpperCase() + chat.type?.slice(1)}`}
            subtitle="Send a message to begin your conversation"
            chatType={chat.type}
          />
        ) : (
          <>
            <MessageList
              messages={messages}
              loading={sendMessageMutation.isPending && !streamingMessage}
              isMobile={isMobile}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onRegenerate={handleRegenerateMessage}
              streamingMessage={streamingMessage}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ 
        position: 'sticky',
        bottom: 0,
        background: theme.palette.mode === 'dark'
          ? alpha('#1e1e2e', 0.9)
          : alpha('#ffffff', 0.9),
        backdropFilter: 'blur(10px)',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 10,
      }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          placeholder={`Message ${chat.type?.charAt(0).toUpperCase() + chat.type?.slice(1)}...`}
          chatType={chat.type}
          isStreaming={!!streamingMessage}
        />
      </Box>
    </Box>
  );
};

export default Chat; 