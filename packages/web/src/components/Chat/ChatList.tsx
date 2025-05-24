import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  Divider,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Archive,
  PushPin,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { Chat } from '../../types';

interface ChatListProps {
  type: 'claude' | 'grok';
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

const ChatList: React.FC<ChatListProps> = ({
  type,
  selectedChatId,
  onSelectChat,
  onNewChat,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Fetch chats
  const { data, isLoading } = useQuery({
    queryKey: ['chats', type, showArchived],
    queryFn: async () => {
      const response = await apiService.get('/chats', {
        type,
        isArchived: showArchived,
      });
      return response.data;
    },
  });

  const chats = data?.chats || [];
  
  // Filter chats by search
  const filteredChats = chats.filter((chat: Chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and regular chats
  const pinnedChats = filteredChats.filter((chat: Chat) => chat.isPinned);
  const regularChats = filteredChats.filter((chat: Chat) => !chat.isPinned);

  const handleCreateChat = async () => {
    try {
      const response = await apiService.post('/chats', {
        type,
        model: type === 'claude' ? 'claude-3.5-sonnet' : 'grok-2',
        title: 'New Chat',
      });
      
      if (response.data) {
        const newChat = response.data.chat;
        navigate(`/chat/${type}/${newChat._id}`);
        onSelectChat(newChat._id);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const formatChatDate = (date: string) => {
    const chatDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(chatDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return format(chatDate, 'HH:mm');
    } else if (format(chatDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(chatDate, 'MMM d');
    }
  };

  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        borderRight: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {type === 'claude' ? 'Claude' : 'Grok'} Chats
          </Typography>
          <IconButton onClick={handleCreateChat} color="primary">
            <Add />
          </IconButton>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                >
                  <FilterList fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Filter menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setShowArchived(!showArchived);
            setFilterAnchorEl(null);
          }}
        >
          <Archive fontSize="small" sx={{ mr: 1 }} />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </MenuItem>
      </Menu>

      {/* Chats list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {/* Pinned chats */}
            {pinnedChats.length > 0 && (
              <>
                <ListItem sx={{ px: 2, py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    PINNED
                  </Typography>
                </ListItem>
                {pinnedChats.map((chat: Chat) => (
                  <ChatListItem
                    key={chat._id}
                    chat={chat}
                    isSelected={chat._id === selectedChatId}
                    onClick={() => onSelectChat(chat._id)}
                  />
                ))}
                <Divider sx={{ my: 1 }} />
              </>
            )}

            {/* Regular chats */}
            {regularChats.length > 0 ? (
              regularChats.map((chat: Chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  isSelected={chat._id === selectedChatId}
                  onClick={() => onSelectChat(chat._id)}
                />
              ))
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No chats yet
                </Typography>
                <Button
                  variant="text"
                  startIcon={<Add />}
                  onClick={handleCreateChat}
                  sx={{ mt: 1 }}
                >
                  Start a new chat
                </Button>
              </Box>
            )}
          </List>
        )}
      </Box>

      {/* Show archived indicator */}
      {showArchived && (
        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            Showing archived chats
          </Typography>
        </Box>
      )}
    </Box>
  );
};

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isSelected, onClick }) => {
  const formatChatDate = (date: string) => {
    const chatDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(chatDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return format(chatDate, 'HH:mm');
    } else if (format(chatDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(chatDate, 'MMM d');
    }
  };

  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.5,
        '&.Mui-selected': {
          bgcolor: 'primary.50',
          '&:hover': {
            bgcolor: 'primary.100',
          },
        },
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {chat.isPinned && <PushPin fontSize="small" />}
            <Typography variant="body2" noWrap>
              {chat.title}
            </Typography>
          </Box>
        }
        secondary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatChatDate(chat.updatedAt)}
            </Typography>
            {chat.metadata.messageCount > 0 && (
              <Chip
                label={`${chat.metadata.messageCount}`}
                size="small"
                sx={{ height: 16, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
};

export default ChatList;