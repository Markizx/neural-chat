import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Chip,
  Menu,
  MenuItem,
  Divider,
  InputAdornment,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Archive,
  PushPin,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { Chat } from '../../types';

interface ChatListProps {
  type: 'claude' | 'grok';
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  isMobile?: boolean;
}

const ChatList: React.FC<ChatListProps> = ({
  type,
  selectedChatId,
  onSelectChat,
  onNewChat,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
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

  const chats = (data as any)?.chats || [];
  
  // Filter chats by search
  const filteredChats = chats.filter((chat: any) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate pinned and regular chats
  const pinnedChats = filteredChats.filter((chat: any) => chat.isPinned);
  const regularChats = filteredChats.filter((chat: any) => !chat.isPinned);

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.post(`/chats`, {
        type,
        model: type === 'claude' ? 'claude-3-5-sonnet-20241022' : 'grok-2-1212',
        title: `New ${type} Chat`,
      });
      
      if (response.data) {
        const newChat = (response.data as any).chat;
        navigate(`/chat/${type}/${newChat._id}`);
        onSelectChat(newChat._id);
      }
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to create chat:', error);
    },
  });

  const handleCreateChat = async () => {
    createChatMutation.mutate();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatChatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <Box
      sx={{
        width: isMobile ? '100%' : 300,
        height: '100%',
        borderRight: isMobile ? 0 : 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        position: isMobile ? 'relative' : 'static',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: isMobile ? (isSmallMobile ? 1.5 : 2) : 2,
        borderBottom: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography 
            variant={isMobile ? (isSmallMobile ? "subtitle1" : "h6") : "h6"} 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
            }}
          >
            {type === 'claude' ? 'Claude' : 'Grok'} Chats
          </Typography>
          <IconButton 
            onClick={handleCreateChat} 
            color="primary"
            size={isMobile && isSmallMobile ? "small" : "medium"}
            sx={{
              background: isMobile ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
              color: isMobile ? 'white' : 'inherit',
              '&:hover': {
                background: isMobile ? 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)' : undefined,
              },
            }}
          >
            <Add />
          </IconButton>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size={isMobile && isSmallMobile ? "small" : "small"}
          placeholder="Поиск чатов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? '12px' : '8px',
            },
          }}
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
          {showArchived ? 'Скрыть архивные' : 'Показать архивные'}
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
                    ЗАКРЕПЛЁННЫЕ
                  </Typography>
                </ListItem>
                {pinnedChats.map((chat: Chat) => (
                  <ChatListItem
                    key={chat._id}
                    chat={chat}
                    isSelected={chat._id === selectedChatId}
                    onClick={() => onSelectChat(chat._id)}
                    isMobile={isMobile}
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
                  isMobile={isMobile}
                />
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery ? 'Чаты не найдены' : 'Нет чатов'}
                </Typography>
                {!searchQuery && (
                  <Button
                    variant="outlined"
                    onClick={handleCreateChat}
                    sx={{ mt: 2 }}
                    size={isMobile && isSmallMobile ? "small" : "medium"}
                  >
                    Создать первый чат
                  </Button>
                )}
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
  isMobile?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ 
  chat, 
  isSelected, 
  onClick, 
  isMobile = false 
}) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  
  const formatChatDate = (date: string) => {
    return format(new Date(date), isMobile ? 'dd.MM' : 'MMM d');
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isSelected}
        onClick={onClick}
        sx={{
          px: isMobile ? (isSmallMobile ? 1.5 : 2) : 2,
          py: isMobile ? 1.5 : 1,
          borderRadius: isMobile ? '12px' : '8px',
          mx: isMobile ? 1 : 0.5,
          mb: isMobile ? 0.5 : 0.25,
          transition: 'all 0.2s ease',
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(99, 102, 241, 0.15)'
              : 'rgba(99, 102, 241, 0.08)',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(99, 102, 241, 0.2)'
                : 'rgba(99, 102, 241, 0.12)',
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  fontWeight: isSelected ? 600 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  fontSize: isMobile && isSmallMobile ? '0.875rem' : '1rem',
                  color: 'text.primary',
                }}
              >
                {chat.title}
              </Box>
              {chat.isPinned && (
                <PushPin 
                  fontSize={isMobile && isSmallMobile ? "small" : "small"} 
                  sx={{ color: 'primary.main' }} 
                />
              )}
            </Box>
          }
          secondary={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mt: 0.5,
            }}>
              <Box
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  mr: 1,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                {chat.lastMessage?.content || 'Новый чат'}
              </Box>
              <Box
                sx={{ 
                  fontSize: isMobile && isSmallMobile ? '0.7rem' : '0.75rem',
                  whiteSpace: 'nowrap',
                  color: 'text.secondary',
                }}
              >
                {formatChatDate(chat.updatedAt)}
              </Box>
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default ChatList;