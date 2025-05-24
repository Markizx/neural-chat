import { apiService } from './api.service';
import { Chat, Message, CreateChatRequest, SendMessageRequest } from '../types';

class ChatService {
  // Chat operations
  async getChats(params?: {
    type?: 'claude' | 'grok';
    isArchived?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ chats: Chat[]; pagination: any }> {
    const response = await apiService.get<{ chats: Chat[]; pagination: any }>('/chats', params);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get chats');
    }
    return response.data!;
  }

  async getChat(chatId: string): Promise<Chat> {
    const response = await apiService.get<{ chat: Chat }>(`/chats/${chatId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get chat');
    }
    return response.data!.chat;
  }

  async createChat(type: 'claude' | 'grok', model: string, title?: string): Promise<Chat> {
    const response = await apiService.post<{ chat: Chat }>('/chats', {
      type,
      model,
      title: title || `New ${type} Chat`,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create chat');
    }
    return response.data!.chat;
  }

  async updateChat(chatId: string, updates: Partial<Chat>): Promise<Chat> {
    const response = await apiService.put<{ chat: Chat }>(`/chats/${chatId}`, updates);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update chat');
    }
    return response.data!.chat;
  }

  async deleteChat(chatId: string): Promise<void> {
    const response = await apiService.delete(`/chats/${chatId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete chat');
    }
  }

  async archiveChat(chatId: string): Promise<Chat> {
    const response = await apiService.post<{ chat: Chat }>(`/chats/${chatId}/archive`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to archive chat');
    }
    return response.data!.chat;
  }

  async unarchiveChat(chatId: string): Promise<Chat> {
    const response = await apiService.post<{ chat: Chat }>(`/chats/${chatId}/unarchive`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to unarchive chat');
    }
    return response.data!.chat;
  }

  async pinChat(chatId: string): Promise<Chat> {
    const response = await apiService.post<{ chat: Chat }>(`/chats/${chatId}/pin`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to pin chat');
    }
    return response.data!.chat;
  }

  async shareChat(chatId: string): Promise<{ shareId: string; url: string }> {
    const response = await apiService.post<{ shareId: string; url: string }>(`/chats/${chatId}/share`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to share chat');
    }
    return response.data!;
  }

  async searchChats(query: string): Promise<Chat[]> {
    const response = await apiService.get<{ chats: Chat[] }>('/chats/search', { q: query });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to search chats');
    }
    return response.data!.chats;
  }

  // Message operations
  async getMessages(chatId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<Message[]> {
    const response = await apiService.get<{ messages: Message[] }>(`/chats/${chatId}/messages`, params);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get messages');
    }
    return response.data!.messages;
  }

  async sendMessage(
    chatId: string,
    content: string,
    attachments?: any[]
  ): Promise<{ userMessage: Message; assistantMessage?: Message }> {
    const response = await apiService.post<{ userMessage: Message; assistantMessage?: Message }>(
      `/chats/${chatId}/messages`,
      { content, attachments }
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send message');
    }
    return response.data!;
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    const response = await apiService.put<{ message: Message }>(`/messages/${messageId}`, { content });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to edit message');
    }
    return response.data!.message;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const response = await apiService.delete(`/messages/${messageId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete message');
    }
  }

  async regenerateMessage(messageId: string): Promise<Message> {
    const response = await apiService.post<{ message: Message }>(`/messages/${messageId}/regenerate`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to regenerate message');
    }
    return response.data!.message;
  }

  async provideFeedback(messageId: string, rating: number, comment?: string): Promise<void> {
    const response = await apiService.post(`/messages/${messageId}/feedback`, { rating, comment });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to provide feedback');
    }
  }

  async searchMessages(query: string): Promise<Message[]> {
    const response = await apiService.get<{ messages: Message[] }>('/messages/search', { q: query });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to search messages');
    }
    return response.data!.messages;
  }

  // File operations
  async uploadFiles(chatId: string, files: File[]): Promise<any[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await apiService.upload<{ files: any[] }>(`/chats/${chatId}/files`, formData);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to upload files');
    }
    return response.data!.files;
  }

  // Export operations
  async exportChat(chatId: string, format: 'pdf' | 'markdown' | 'json' = 'markdown'): Promise<Blob> {
    const response = await apiService.get(`/chats/${chatId}/export`, { format });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to export chat');
    }
    
    // Convert response to blob
    const blob = new Blob([response.data], { 
      type: format === 'pdf' ? 'application/pdf' : 
            format === 'json' ? 'application/json' : 
            'text/markdown' 
    });
    return blob;
  }
}

export const chatService = new ChatService();