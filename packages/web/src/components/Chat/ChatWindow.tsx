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
import { Chat, Message } from '../../types';

interface ChatWindowProps {
  type: 'claude' | 'grok';
  chatId?: string;
  initialChat?: Chat;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ type, chatId, initialChat }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const { socket } = useWebSocket();
  
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
  } = useChat(chatId, initialChat);

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
      await updateChat(chat._id, { sharing: { isPublic: !chat.sharing.isPublic } });
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
    if (chat && window.confirm('Are you sure you want to delete this chat?')) {
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
          p: 4,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Start a new {type === 'claude' ? 'Claude' : 'Grok'} chat
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a chat from the sidebar or type a message to begin
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
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
            {chat?.title || 'New Chat'}
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
                {chat.isPinned ? 'Unpin' : 'Pin'} Chat
              </MenuItem>
              <MenuItem onClick={handleShare}>
                <Share fontSize="small" sx={{ mr: 1 }} />
                {chat.sharing.isPublic ? 'Make Private' : 'Share'}
              </MenuItem>
              <MenuItem onClick={handleArchive}>
                <Archive fontSize="small" sx={{ mr: 1 }} />
                {chat.isArchived ? 'Unarchive' : 'Archive'}
              </MenuItem>
              <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
                <Delete fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>
          </>
        )}
      </Paper>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <MessageList
              messages={messages}
              onEdit={editMessage}
              onDelete={deleteMessage}
              onRegenerate={regenerateMessage}
            />
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={loading}
        projectId={chat?.projectId}
      />
    </Box>
  );
};

export default ChatWindow;