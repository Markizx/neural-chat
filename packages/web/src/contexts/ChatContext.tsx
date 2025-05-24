import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Chat, Message } from '../types';
import { chatService } from '../services/chat.service';
import { useWebSocket } from '../hooks/useWebSocket';

interface ChatContextType {
  activeChats: Map<string, Chat>;
  messages: Map<string, Message[]>;
  loadingChats: Set<string>;
  typingUsers: Map<string, Set<string>>;
  
  // Chat operations
  loadChat: (chatId: string) => Promise<void>;
  createChat: (type: 'claude' | 'grok', model: string) => Promise<Chat>;
  updateChat: (chatId: string, updates: Partial<Chat>) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  
  // Message operations
  sendMessage: (chatId: string, content: string, attachments?: any[]) => Promise<void>;
  editMessage: (chatId: string, messageId: string, content: string) => Promise<void>;
  deleteMessage: (chatId: string, messageId: string) => Promise<void>;
  
  // Real-time operations
  setTyping: (chatId: string, isTyping: boolean) => void;
  markAsRead: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeChats, setActiveChats] = useState<Map<string, Chat>>(new Map());
  const [messages, setMessages] = useState<Map<string, Message[]>>(new Map());
  const [loadingChats, setLoadingChats] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  
  const { socket, on, off, emit } = useWebSocket();

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { chatId: string; message: Message }) => {
      setMessages(prev => {
        const chatMessages = prev.get(data.chatId) || [];
        return new Map(prev).set(data.chatId, [...chatMessages, data.message]);
      });
    };

    const handleMessageUpdated = (data: { chatId: string; message: Message }) => {
      setMessages(prev => {
        const chatMessages = prev.get(data.chatId) || [];
        const updatedMessages = chatMessages.map(msg => 
          msg._id === data.message._id ? data.message : msg
        );
        return new Map(prev).set(data.chatId, updatedMessages);
      });
    };

    const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
      setMessages(prev => {
        const chatMessages = prev.get(data.chatId) || [];
        const filteredMessages = chatMessages.filter(msg => msg._id !== data.messageId);
        return new Map(prev).set(data.chatId, filteredMessages);
      });
    };

    const handleTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const chatTyping = new Set(prev.get(data.chatId) || []);
        if (data.isTyping) {
          chatTyping.add(data.userId);
        } else {
          chatTyping.delete(data.userId);
        }
        return new Map(prev).set(data.chatId, chatTyping);
      });
    };

    on('message:new', handleNewMessage);
    on('message:updated', handleMessageUpdated);
    on('message:deleted', handleMessageDeleted);
    on('typing', handleTyping);

    return () => {
      off('message:new', handleNewMessage);
      off('message:updated', handleMessageUpdated);
      off('message:deleted', handleMessageDeleted);
      off('typing', handleTyping);
    };
  }, [socket, on, off]);

  // Load chat and messages
  const loadChat = useCallback(async (chatId: string) => {
    if (loadingChats.has(chatId)) return;

    setLoadingChats(prev => new Set(prev).add(chatId));
    try {
      const [chatData, messagesData] = await Promise.all([
        chatService.getChat(chatId),
        chatService.getMessages(chatId),
      ]);

      setActiveChats(prev => new Map(prev).set(chatId, chatData));
      setMessages(prev => new Map(prev).set(chatId, messagesData));
      
      // Join chat room for real-time updates
      emit('chat:join', chatId);
    } catch (error) {
      console.error('Failed to load chat:', error);
      throw error;
    } finally {
      setLoadingChats(prev => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    }
  }, [emit]);

  // Create new chat
  const createChat = useCallback(async (type: 'claude' | 'grok', model: string): Promise<Chat> => {
    const chat = await chatService.createChat(type, model);
    setActiveChats(prev => new Map(prev).set(chat._id, chat));
    setMessages(prev => new Map(prev).set(chat._id, []));
    return chat;
  }, []);

  // Update chat
  const updateChat = useCallback(async (chatId: string, updates: Partial<Chat>) => {
    const updatedChat = await chatService.updateChat(chatId, updates);
    setActiveChats(prev => new Map(prev).set(chatId, updatedChat));
  }, []);

  // Delete chat
  const deleteChat = useCallback(async (chatId: string) => {
    await chatService.deleteChat(chatId);
    setActiveChats(prev => {
      const newMap = new Map(prev);
      newMap.delete(chatId);
      return newMap;
    });
    setMessages(prev => {
      const newMap = new Map(prev);
      newMap.delete(chatId);
      return newMap;
    });
    
    // Leave chat room
    emit('chat:leave', chatId);
  }, [emit]);

  // Send message
  const sendMessage = useCallback(async (chatId: string, content: string, attachments?: any[]) => {
    const response = await chatService.sendMessage(chatId, content, attachments);
    
    // Add user message immediately
    if (response.userMessage) {
      setMessages(prev => {
        const chatMessages = prev.get(chatId) || [];
        return new Map(prev).set(chatId, [...chatMessages, response.userMessage]);
      });
    }
    
    // Assistant message will be added via WebSocket
  }, []);

  // Edit message
  const editMessage = useCallback(async (chatId: string, messageId: string, content: string) => {
    const updatedMessage = await chatService.editMessage(messageId, content);
    setMessages(prev => {
      const chatMessages = prev.get(chatId) || [];
      const updatedMessages = chatMessages.map(msg => 
        msg._id === messageId ? updatedMessage : msg
      );
      return new Map(prev).set(chatId, updatedMessages);
    });
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    await chatService.deleteMessage(messageId);
    setMessages(prev => {
      const chatMessages = prev.get(chatId) || [];
      const filteredMessages = chatMessages.filter(msg => msg._id !== messageId);
      return new Map(prev).set(chatId, filteredMessages);
    });
  }, []);

  // Set typing status
  const setTyping = useCallback((chatId: string, isTyping: boolean) => {
    emit('typing', { chatId, isTyping });
  }, [emit]);

  // Mark messages as read
  const markAsRead = useCallback((chatId: string) => {
    emit('chat:markAsRead', chatId);
  }, [emit]);

  const value: ChatContextType = {
    activeChats,
    messages,
    loadingChats,
    typingUsers,
    loadChat,
    createChat,
    updateChat,
    deleteChat,
    sendMessage,
    editMessage,
    deleteMessage,
    setTyping,
    markAsRead,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};