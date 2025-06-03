import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Divider,
  InputAdornment,
  CircularProgress,
  Button,
  useTheme,
  useMediaQuery,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemIcon,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  Archive,
  PushPin,
  MoreVert,
  Delete,
  Edit,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { Chat } from '../../types';

interface ChatListProps {
  type: 'claude' | 'grok';
  selectedChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat?: () => void;
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
  const queryClient = useQueryClient();

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
        model: type === 'claude' ? 'claude-4-sonnet' : 'grok-2-image',
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
      // eslint-disable-next-line no-console
      console.error('Failed to create chat:', error);
    },
  });

  // Delete chat mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      await apiService.delete(`/chats/${chatId}`);
    },
    onSuccess: (_, deletedChatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats', type] });
      // If deleted chat was selected, navigate to chat list
      if (selectedChatId === deletedChatId) {
        navigate(`/chat/${type}`);
      }
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to delete chat:', error);
    },
  });

  // Update chat mutation
  const updateChatMutation = useMutation({
    mutationFn: async ({ chatId, title }: { chatId: string; title: string }) => {
      await apiService.put(`/chats/${chatId}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats', type] });
    },
    onError: (error) => {
      // eslint-disable-next-line no-console
      console.error('Failed to update chat:', error);
    },
  });

  const handleCreateChat = async () => {
    createChatMutation.mutate();
  };

  const handleDeleteChat = (chatId: string) => {
    deleteChatMutation.mutate(chatId);
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    updateChatMutation.mutate({ chatId, title: newTitle });
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
        maxHeight: '100%',
        borderRight: isMobile ? 0 : 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        position: isMobile ? 'relative' : 'static',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: isMobile ? (isSmallMobile ? 1 : 1.5) : 1,
        borderBottom: isMobile ? `1px solid ${theme.palette.divider}` : 'none',
        flexShrink: 0,
        maxHeight: '120px',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
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
          size="small"
          placeholder="Поиск чатов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: isMobile ? '12px' : '8px',
              height: '36px',
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
                    onDelete={handleDeleteChat}
                    onRename={handleRenameChat}
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
                  onDelete={handleDeleteChat}
                  onRename={handleRenameChat}
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
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, newTitle: string) => void;
  isMobile?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ 
  chat, 
  isSelected, 
  onClick, 
  onDelete, 
  onRename, 
  isMobile = false 
}) => {
  const theme = useTheme();
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(chat.title);
  
  const formatChatDate = (date: string) => {
    return format(new Date(date), isMobile ? 'dd.MM' : 'MMM d');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    onDelete(chat._id);
    setDeleteDialogOpen(false);
  };

  const handleRenameClick = () => {
    setNewTitle(chat.title);
    setRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleRenameConfirm = () => {
    if (newTitle.trim() && newTitle.trim() !== chat.title) {
      onRename(chat._id, newTitle.trim());
    }
    setRenameDialogOpen(false);
  };

  return (
    <>
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    fontWeight: isSelected ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    fontSize: isMobile && isSmallMobile ? '0.875rem' : '1rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  {chat.title}
                </span>
                {chat.isPinned && (
                  <PushPin 
                    fontSize={isMobile && isSmallMobile ? "small" : "small"} 
                    sx={{ color: 'primary.main' }} 
                  />
                )}
              </span>
            }
            secondary={
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginTop: '4px',
              }}>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    marginRight: '8px',
                    fontSize: '0.75rem',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {chat.lastMessage?.content || 'Новый чат'}
                </span>
                <span
                  style={{ 
                    fontSize: isMobile && isSmallMobile ? '0.7rem' : '0.75rem',
                    whiteSpace: 'nowrap',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {formatChatDate(chat.updatedAt)}
                </span>
              </span>
            }
          />
          
          {/* Menu button */}
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </ListItemButton>
      </ListItem>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleRenameClick}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Переименовать
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          Удалить
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить чат?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить чат "{chat.title}"? 
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            color="error"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog 
        open={renameDialogOpen} 
        onClose={() => setRenameDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Переименовать чат</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Название чата"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameConfirm();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleRenameConfirm}
            variant="contained"
            disabled={!newTitle.trim() || newTitle.trim() === chat.title}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatList;