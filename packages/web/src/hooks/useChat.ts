import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { Chat, Message } from '../types';

interface UseChatOptions {
  chatId?: string;
  initialChat?: Chat;
}

export const useChat = (chatId?: string, initialChat?: Chat) => {
  const queryClient = useQueryClient();
  const [chat, setChat] = useState<Chat | null>(initialChat || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat
  const chatQuery = useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const response = await apiService.get<{ chat: Chat }>(`/chats/${chatId}`);
      return response.data?.chat;
    },
    enabled: !!chatId && !initialChat,
  });

  // Fetch messages
  const messagesQuery = useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const response = await apiService.get<{ messages: Message[] }>(
        `/chats/${chatId}/messages`
      );
      return response.data?.messages || [];
    },
    enabled: !!chatId,
  });

  // Update state when queries change
  useEffect(() => {
    if (chatQuery.data) {
      setChat(chatQuery.data);
    }
  }, [chatQuery.data]);

  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(messagesQuery.data);
    }
  }, [messagesQuery.data]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      content,
      attachments,
    }: {
      content: string;
      attachments?: any[];
    }) => {
      if (!chatId) throw new Error('No chat ID');
      const response = await apiService.post(`/chats/${chatId}/messages`, {
        content,
        attachments,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.userMessage && data?.assistantMessage) {
        setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      }
      queryClient.invalidateQueries({ queryKey: ['messages', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to send message');
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
      const response = await apiService.put(`/chats/${chatId}`, updates);
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
        await sendMessageMutation.mutateAsync({ content, attachments });
      } finally {
        setLoading(false);
      }
    },
    [sendMessageMutation]
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
  };
};