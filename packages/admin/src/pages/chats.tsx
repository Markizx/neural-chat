import React, { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface Chat {
  _id: string;
  title: string;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
  messageCount: number;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatStats {
  totalChats: number;
  activeChats: number;
  todayMessages: number;
  averageLength: number;
}

const ChatsPage: NextPage = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [stats, setStats] = useState<ChatStats>({
    totalChats: 0,
    activeChats: 0,
    todayMessages: 0,
    averageLength: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalChats, setTotalChats] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/admin/chats?page=${page}&limit=${rowsPerPage}&search=${searchTerm}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.data.chats);
        setTotalChats(data.data.total);
      } else {
        throw new Error('Failed to fetch chats');
      }
    } catch (error) {
      setError('Failed to fetch chats');
      console.error('Error fetching chats:', error);
          } finally {
        setLoading(false);
      }
    }, [page, rowsPerPage, searchTerm]);
  
    const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/chats/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/v1/admin/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchChats();
        fetchStats();
        setDeleteDialogOpen(false);
        setSelectedChat(null);
      } else {
        throw new Error('Failed to delete chat');
      }
    } catch (error) {
      setError('Failed to delete chat');
      console.error('Error deleting chat:', error);
    }
  };

  const handleExportChats = async () => {
    try {
      const response = await fetch('/api/v1/admin/chats/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chats-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      setError('Failed to export chats');
      console.error('Error exporting chats:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Управление чатами
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchChats();
              fetchStats();
            }}
          >
            Обновить
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExportChats}
          >
            Экспорт
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Всего чатов
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {stats.totalChats.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Активные чаты
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {stats.activeChats.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Сообщений сегодня
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {stats.todayMessages.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Средняя длина чата
              </Typography>
              <Typography variant="h4" component="div" color="warning.main">
                {stats.averageLength}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Поиск и фильтры */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Поиск по названию или пользователю..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
      </Paper>

      {/* Таблица чатов */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Название</TableCell>
                <TableCell>Пользователь</TableCell>
                <TableCell>Сообщений</TableCell>
                <TableCell>Последнее сообщение</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Создан</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : chats.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      Чаты не найдены
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                chats.map((chat) => (
                  <TableRow key={chat._id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {chat.title || 'Без названия'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {chat.user?.name || 'Неизвестный'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {chat.user?.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={chat.messageCount} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {chat.lastMessage ? (
                        <Box>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {chat.lastMessage.content}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(chat.lastMessage.timestamp)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Нет сообщений
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={chat.isActive ? 'Активный' : 'Неактивный'}
                        color={chat.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(chat.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedChat(chat);
                            setViewDialogOpen(true);
                          }}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedChat(chat);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalChats}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : 'более ' + to}`
          }
        />
      </Paper>

      {/* Диалог просмотра чата */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Информация о чате</DialogTitle>
        <DialogContent>
          {selectedChat && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Название
                  </Typography>
                  <Typography variant="body1">
                    {selectedChat.title || 'Без названия'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Пользователь
                  </Typography>
                  <Typography variant="body1">
                    {selectedChat.user?.name || 'Неизвестный'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Email пользователя
                  </Typography>
                  <Typography variant="body1">
                    {selectedChat.user?.email || 'Неизвестный'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Количество сообщений
                  </Typography>
                  <Typography variant="body1">
                    {selectedChat.messageCount}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Статус
                  </Typography>
                  <Chip 
                    label={selectedChat.isActive ? 'Активный' : 'Неактивный'}
                    color={selectedChat.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Создан
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedChat.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Последнее сообщение
                  </Typography>
                  <Typography variant="body1">
                    {selectedChat.lastMessage?.content || 'Нет сообщений'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Подтверждение удаления</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить чат &quot;{selectedChat?.title || 'Без названия'}&quot;?
            Это действие необратимо.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Отмена
          </Button>
          <Button
            color="error"
            onClick={() => selectedChat && handleDeleteChat(selectedChat._id)}
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatsPage; 