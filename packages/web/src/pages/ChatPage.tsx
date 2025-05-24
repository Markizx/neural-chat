import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ChatWindow from '../components/Chat/ChatWindow';
import ChatList from '../components/Chat/ChatList';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';

const ChatPage: React.FC = () => {
  const { type, id } = useParams<{ type: 'claude' | 'grok'; id?: string }>();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(id);

  // Fetch chat if ID is provided
  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', selectedChatId],
    queryFn: async () => {
      if (!selectedChatId) return null;
      const response = await apiService.get(`/chats/${selectedChatId}`);
      return response.data;
    },
    enabled: !!selectedChatId,
  });

  useEffect(() => {
    setSelectedChatId(id);
  }, [id]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    window.history.pushState(null, '', `/chat/${type}/${chatId}`);
  };

  const handleNewChat = () => {
    setSelectedChatId(undefined);
    window.history.pushState(null, '', `/chat/${type}`);
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

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <ChatList
        type={type!}
        selectedChatId={selectedChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
      />
      <ChatWindow
        type={type!}
        chatId={selectedChatId}
        initialChat={chat}
      />
    </Box>
  );
};

export default ChatPage;