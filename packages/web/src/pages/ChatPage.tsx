import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  CircularProgress, 
  useTheme, 
  useMediaQuery,
  Fab,
  Slide,
  IconButton,
  AppBar,
  Toolbar,
  Typography
} from '@mui/material';
import { 
  ArrowBack, 
  Chat as ChatIcon,
  List as ListIcon 
} from '@mui/icons-material';
import ChatWindow from '../components/Chat/ChatWindow';
import ChatList from '../components/Chat/ChatList';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { Chat } from '../types';

const ChatPage: React.FC = () => {
  const { type, id } = useParams<{ type: 'claude' | 'grok'; id?: string }>();
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(id);
  const [showChatList, setShowChatList] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  // Fetch chat if ID is provided
  const { data: chat, isLoading } = useQuery<Chat | null>({
    queryKey: ['chat', selectedChatId],
    queryFn: async (): Promise<Chat | null> => {
      if (!selectedChatId) return null;
      const response = await apiService.get(`/chats/${selectedChatId}`);
      return response.data as Chat;
    },
    enabled: !!selectedChatId,
  });

  useEffect(() => {
    setSelectedChatId(id);
    // На мобильных устройствах скрываем список чатов при выборе чата
    if (isMobile && id) {
      setShowChatList(false);
    }
  }, [id, isMobile]);

  // На мобильных устройствах показываем список чатов по умолчанию, если нет выбранного чата
  useEffect(() => {
    if (isMobile && !selectedChatId) {
      setShowChatList(true);
    }
  }, [isMobile, selectedChatId]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    window.history.pushState(null, '', `/chat/${type}/${chatId}`);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleNewChat = () => {
    setSelectedChatId(undefined);
    window.history.pushState(null, '', `/chat/${type}`);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChatList(true);
    }
  };

  const toggleChatList = () => {
    setShowChatList(!showChatList);
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

  if (isMobile) {
    return (
      <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        {/* Мобильный заголовок */}
        {selectedChatId && !showChatList && (
          <AppBar 
            position="static" 
            elevation={0}
            sx={{ 
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Toolbar sx={{ minHeight: '56px !important' }}>
              <IconButton
                edge="start"
                onClick={handleBackToList}
                sx={{ mr: 2 }}
              >
                <ArrowBack />
              </IconButton>
              <Typography 
                variant="h6" 
                sx={{ 
                  flexGrow: 1,
                  fontSize: isSmallMobile ? '1rem' : '1.25rem',
                  fontWeight: 600,
                }}
              >
                {chat?.title || `${type === 'claude' ? 'Claude' : 'Grok'} Chat`}
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Список чатов */}
        <Slide direction="right" in={showChatList} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme.palette.background.default,
              zIndex: 1,
            }}
          >
            <ChatList
              type={type!}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              onNewChat={handleNewChat}
              isMobile={true}
            />
          </Box>
        </Slide>

        {/* Окно чата */}
        <Box
          sx={{
            height: selectedChatId && !showChatList ? 'calc(100% - 56px)' : '100%',
            display: showChatList ? 'none' : 'block',
          }}
        >
          <ChatWindow
            type={type!}
            chatId={selectedChatId}
            initialChat={chat as any}
            isMobile={true}
          />
        </Box>

        {/* FAB для переключения списка чатов */}
        {selectedChatId && !showChatList && (
          <Fab
            color="primary"
            size={isSmallMobile ? "medium" : "large"}
            onClick={toggleChatList}
            sx={{
              position: 'fixed',
              bottom: isSmallMobile ? 16 : 24,
              left: isSmallMobile ? 16 : 24,
              zIndex: 1000,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
              },
            }}
          >
            <ListIcon />
          </Fab>
        )}
      </Box>
    );
  }

  // Десктопная версия
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
        initialChat={chat as any}
      />
    </Box>
  );
};

export default ChatPage;