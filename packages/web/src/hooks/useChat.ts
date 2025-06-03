import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chat.service';
import { apiService } from '../services/api.service';
import { Chat, Message } from '@neuralchat/shared/types';
import { useWebSocket } from './useWebSocket';
import { extractArtifacts, removeArtifactsFromText } from '../utils/artifactParser';

// Функция для преобразования File в base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Убираем префикс data:type;base64,
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

interface UseChatOptions {
  chatId?: string;
  initialChat?: Chat;
  type?: 'claude' | 'grok';
}

interface SendMessageOptions {
  content: string;
  attachments?: any[];
}

export const useChat = (chatId?: string, initialChat?: Chat, type?: 'claude' | 'grok') => {
  const queryClient = useQueryClient();
  const [chat, setChat] = useState<Chat | null>(initialChat || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string;
    role: 'assistant';
    content: string;
    model?: string;
    isStreaming: boolean;
  } | null>(null);
  const { socket, on, off } = useWebSocket();

  // Fetch chat
  const chatQuery = useQuery<Chat | null>({
    queryKey: ['chat', chatId],
    queryFn: async (): Promise<Chat | null> => {
      if (!chatId) return null;
      const response = await apiService.get<{ chat: Chat }>(`/chats/${chatId}`);
      return response.data?.chat || null;
    },
    enabled: !!chatId && !initialChat,
  });

  // Fetch messages
  const messagesQuery = useQuery<Message[]>({
    queryKey: ['messages', chatId],
    queryFn: async (): Promise<Message[]> => {
      if (!chatId) return [];
      const response = await apiService.get<{ messages: Message[] }>(
        `/messages/chats/${chatId}/messages`
      );
      return response.data?.messages || [];
    },
    enabled: !!chatId,
  });

  // Update state when queries change
  useEffect(() => {
    if (chatQuery.data) {
      setChat(chatQuery.data as Chat);
    }
  }, [chatQuery.data]);

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !chatId) return;

    const handleStreamStart = (data: { chatId: string; messageId: string; model: string }) => {
      if (data.chatId === chatId) {
        console.log('🔄 Stream started:', data);
        setStreamingMessage({ id: data.messageId, role: 'assistant', content: '', model: data.model, isStreaming: true });
      }
    };

    const handleStreamChunk = (data: { chatId: string; messageId: string; content: string }) => {
      if (data.chatId === chatId) {
        console.log('📝 Stream chunk:', data.content);
        setStreamingMessage(prev => prev ? { ...prev, content: prev.content + data.content } : null);
      }
    };

    const handleStreamComplete = (data: { chatId: string; messageId: string; message: Message }) => {
      if (data.chatId === chatId) {
        console.log('✅ Stream complete:', data);
        console.log('📝 Claude response content:', data.message.content);
        
        // Парсим артефакты из сообщения Claude
        const extractedArtifacts = extractArtifacts(data.message.content);
        console.log('🔍 Artifact parsing result:', extractedArtifacts);
        
        if (extractedArtifacts.length > 0) {
          console.log('🎨 Found artifacts:', extractedArtifacts);
          
          // Удаляем теги артефактов из текста
          const cleanContent = removeArtifactsFromText(data.message.content, extractedArtifacts);
          
          // Обновляем сообщение с артефактами и очищенным контентом
          const updatedMessage = {
            ...data.message,
            content: cleanContent,
            artifacts: extractedArtifacts
          };
          
          setMessages(prev => [...prev, updatedMessage]);
        } else {
          setMessages(prev => [...prev, data.message]);
        }
        
        setStreamingMessage(null);
        queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      }
    };

    const handleStreamError = (data: { chatId: string; error: string }) => {
      if (data.chatId === chatId) {
        console.error('❌ Stream error:', data);
        setStreamingMessage(null);
        setError(data.error);
      }
    };

    // Subscribe to WebSocket events
    on('message:streamStart', handleStreamStart);
    on('message:streamChunk', handleStreamChunk);
    on('message:streamComplete', handleStreamComplete);
    on('message:streamError', handleStreamError);

    // Join chat room
    socket.emit('chat:join', chatId);

    // Cleanup
    return () => {
      off('message:streamStart', handleStreamStart);
      off('message:streamChunk', handleStreamChunk);
      off('message:streamComplete', handleStreamComplete);
      off('message:streamError', handleStreamError);
      socket.emit('chat:leave', chatId);
    };
  }, [socket, chatId, on, off, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      attachments,
      type,
    }: {
      content: string;
      attachments?: any[];
      type?: 'claude' | 'grok';
    }) => {
      let currentChatId = chatId;
      
      // If no chatId, create a new chat first
      if (!currentChatId && type) {
        const createResponse = await apiService.post<{ chat: Chat }>('/chats', {
          type,
          model: type === 'claude' ? 'claude-4-sonnet' : 'grok-2-1212',
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
        });
        
        if (!createResponse.data?.chat) {
          throw new Error('Failed to create chat');
        }
        
        currentChatId = createResponse.data.chat._id;
        setChat(createResponse.data.chat);
        
        // Присоединяемся к WebSocket комнате для нового чата
        if (socket) {
          console.log('🔗 Joining new chat room:', currentChatId);
          socket.emit('chat:join', currentChatId);
        }
        
        // Update URL to include the new chat ID
        window.history.replaceState(null, '', `/chat/${type}/${currentChatId}`);
      }
      
      if (!currentChatId) {
        throw new Error('No chat ID available');
      }
      
      // Преобразуем File объекты в правильный формат
      let processedAttachments: any[] = [];
      if (attachments && attachments.length > 0) {
        processedAttachments = await Promise.all(
          attachments.map(async (file: File) => {
            const base64 = await fileToBase64(file);
            
            // Определяем тип для enum в схеме
            let attachmentType: 'image' | 'document' | 'code' | 'other' = 'other';
            if (file.type.startsWith('image/')) {
              attachmentType = 'image';
            } else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('word')) {
              attachmentType = 'document';
            } else if (file.type.includes('javascript') || file.type.includes('typescript') || file.type.includes('python') || file.type.includes('java')) {
              attachmentType = 'code';
            }
            
            return {
              id: `${Date.now()}_${file.name}`,
              name: file.name,
              type: attachmentType,
              mimeType: file.type,
              size: file.size,
              data: base64,
              url: `data:${file.type};base64,${base64}` // Data URL для предпросмотра
            };
          })
        );
        
        console.log('📎 Processed attachments:', processedAttachments.map(att => ({
          name: att.name,
          type: att.type,
          mimeType: att.mimeType,
          size: att.size,
          hasData: !!att.data
        })));
      }
      
      const response = await apiService.post<{ userMessage: Message; assistantMessage: Message }>(`/messages/chats/${currentChatId}/messages`, {
        content,
        attachments: processedAttachments,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.userMessage) {
        setMessages((prev) => [...prev, data.userMessage]);
        // Не добавляем assistantMessage здесь - оно придет через WebSocket
        
        // Если это новый чат, переподключаемся к WebSocket комнате
        if (socket && data.userMessage.chatId !== chatId) {
          console.log('🔗 Joining new chat room:', data.userMessage.chatId);
          socket.emit('chat:join', data.userMessage.chatId);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      // Log error for debugging
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Send message error:', error);
      }
      let errorMessage = 'Failed to send message';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
    }) => {
      const response = await apiService.put(`/messages/${messageId}`, { content });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiService.delete(`/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  // Regenerate message mutation
  const regenerateMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiService.post(`/messages/${messageId}/regenerate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  // Update chat mutation
  const updateChatMutation = useMutation({
    mutationFn: async ({ chatId, updates }: { chatId: string; updates: any }) => {
      const response = await apiService.put<{ chat: Chat }>(`/chats/${chatId}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.chat) {
        setChat(data.chat);
      }
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    },
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await apiService.delete(`/chats/${chatId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });

  // Callbacks
  const sendMessage = useCallback(
    async (content: string, attachments?: any[]) => {
      setLoading(true);
      setError(null);
      try {
        await sendMessageMutation.mutateAsync({ content, attachments, type });
      } finally {
        setLoading(false);
      }
    },
    [sendMessageMutation, type]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      await editMessageMutation.mutateAsync({ messageId, content });
    },
    [editMessageMutation]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await deleteMessageMutation.mutateAsync(messageId);
    },
    [deleteMessageMutation]
  );

  const regenerateMessage = useCallback(
    async (messageId: string) => {
      await regenerateMessageMutation.mutateAsync(messageId);
    },
    [regenerateMessageMutation]
  );

  const updateChat = useCallback(
    async (chatId: string, updates: any) => {
      await updateChatMutation.mutateAsync({ chatId, updates });
    },
    [updateChatMutation]
  );

  const deleteChat = useCallback(
    async (chatId: string) => {
      await deleteChatMutation.mutateAsync(chatId);
    },
    [deleteChatMutation]
  );

  return {
    chat,
    messages,
    loading: loading || chatQuery.isLoading || messagesQuery.isLoading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    regenerateMessage,
    updateChat,
    deleteChat,
    streamingMessage,
  };
};