import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MoreVert,
  Delete,
  Share,
  Archive,
  PushPin,
  Edit,
} from '@mui/icons-material';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChat } from '../../hooks/useChat';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Chat } from '../../types/api.types';

interface ChatWindowProps {
  type: 'claude' | 'grok';
  chatId?: string;
  initialChat?: Chat;
  isMobile?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  type, 
  chatId, 
  initialChat, 
  isMobile = false 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  
  const {
    chat,
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    editMessage,
    regenerateMessage,
    updateChat,
    deleteChat,
  } = useChat(chatId, initialChat, type);

  useEffect(() => {
    if (chatId && socket) {
      socket.emit('chat:join', chatId);
      return () => {
        socket.emit('chat:leave', chatId);
      };
    }
  }, [chatId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShare = async () => {
    handleMenuClose();
    if (chat) {
      const currentIsPublic = chat.sharing?.isPublic || false;
      await updateChat(chat._id, { sharing: { isPublic: !currentIsPublic } });
    }
  };

  const handleArchive = async () => {
    handleMenuClose();
    if (chat) {
      await updateChat(chat._id, { isArchived: !chat.isArchived });
    }
  };

  const handlePin = async () => {
    handleMenuClose();
    if (chat) {
      await updateChat(chat._id, { isPinned: !chat.isPinned });
    }
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (chat && window.confirm('Вы уверены, что хотите удалить этот чат?')) {
      await deleteChat(chat._id);
      window.location.href = `/chat/${type}`;
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    await sendMessage(content, attachments);
  };

  const getModelName = () => {
    if (!chat) return type === 'claude' ? 'Claude 3.5 Sonnet' : 'Grok 2';
    return chat.model;
  };

  if (!chatId) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: isMobile ? 2 : 4,
          textAlign: 'center',
        }}
      >
        <Box>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            color="text.secondary" 
            gutterBottom
            sx={{ 
              fontSize: isMobile && isSmallMobile ? '1.1rem' : undefined,
            }}
          >
            Начните новый {type === 'claude' ? 'Claude' : 'Grok'} чат
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontSize: isMobile && isSmallMobile ? '0.875rem' : undefined,
            }}
          >
            {isMobile 
              ? 'Выберите чат из списка или создайте новый'
              : 'Выберите чат из боковой панели или введите сообщение для начала'
            }
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      position: 'relative',
    }}>
      {/* Header - скрыт на мобильных, так как используется отдельный заголовок */}
      {!isMobile && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 0,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {chat?.title || 'Новый чат'}
            </Typography>
            <Chip
              label={getModelName()}
              size="small"
              color={type === 'claude' ? 'primary' : 'secondary'}
            />
            {chat?.isPinned && <PushPin fontSize="small" />}
          </Box>
          
          {chat && (
            <>
              <IconButton onClick={handleMenuClick}>
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handlePin}>
                  <PushPin fontSize="small" sx={{ mr: 1 }} />
                  {chat.isPinned ? 'Открепить' : 'Закрепить'} чат
                </MenuItem>
                <MenuItem onClick={handleShare}>
                  <Share fontSize="small" sx={{ mr: 1 }} />
                  {chat.sharing?.isPublic ? 'Сделать приватным' : 'Поделиться'}
                </MenuItem>
                <MenuItem onClick={handleArchive}>
                  <Archive fontSize="small" sx={{ mr: 1 }} />
                  {chat.isArchived ? 'Разархивировать' : 'Архивировать'}
                </MenuItem>
                <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                  <Delete fontSize="small" sx={{ mr: 1 }} />
                  Удалить
                </MenuItem>
              </Menu>
            </>
          )}
        </Paper>
      )}

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: isMobile ? (isSmallMobile ? 1 : 2) : 2,
        pb: isMobile ? 1 : 2,
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <MessageList
          messages={messages}
          loading={loading}
          onDeleteMessage={deleteMessage}
          onEditMessage={editMessage}
          onRegenerateMessage={regenerateMessage}
          isMobile={isMobile}
        />
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Box sx={{ 
        borderTop: isMobile ? 0 : 1,
        borderColor: 'divider',
        p: isMobile ? (isSmallMobile ? 1 : 1.5) : 2,
        backgroundColor: theme.palette.background.paper,
      }}>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={loading}
          placeholder={`Сообщение ${type === 'claude' ? 'Claude' : 'Grok'}...`}
          isMobile={isMobile}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;