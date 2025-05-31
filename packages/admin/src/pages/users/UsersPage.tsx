import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  Search,
  MoreVert,
  PersonAdd,
  Edit,
  Block,
  Delete,
  Download,
  Visibility,
  Email,
  Phone,
  CalendarToday,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminApi } from '../../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'deleted';
  subscription: {
    plan: 'free' | 'pro' | 'business';
    status: string;
  };
  usage: {
    totalMessages: number;
    totalTokens: number;
  };
  createdAt: string;
  lastLogin?: string;
}

const UsersPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const queryClient = useQueryClient();

  // Загружаем пользователей
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, rowsPerPage, search, statusFilter, planFilter],
    queryFn: () => adminApi.getUsers({
      page: page + 1,
      limit: rowsPerPage,
      search: search || undefined,
    }),
  });

  const users = usersData?.data?.users || [];
  const totalUsers = usersData?.data?.total || 0;

  // Мутации
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      adminApi.updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditUserOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setMenuAnchor(null);
    },
  });

  const exportUsersMutation = useMutation({
    mutationFn: adminApi.exportUsers,
    onSuccess: (response) => {
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedUser(null);
  };

  const handleViewUser = () => {
    setUserDetailOpen(true);
    handleMenuClose();
  };

  const handleEditUser = () => {
    setEditUserOpen(true);
    handleMenuClose();
  };

  const handleSuspendUser = () => {
    if (selectedUser) {
      updateUserMutation.mutate({
        userId: selectedUser._id,
        data: { 
          status: selectedUser.status === 'suspended' ? 'active' : 'suspended' 
        }
      });
    }
    handleMenuClose();
  };

  const handleDeleteUser = () => {
    if (selectedUser && window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUserMutation.mutate(selectedUser._id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'default';
      case 'pro': return 'primary';
      case 'business': return 'secondary';
      default: return 'default';
    }
  };

  const UserDetailDialog = () => (
    <Dialog open={userDetailOpen} onClose={() => setUserDetailOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        Детали пользователя
      </DialogTitle>
      <DialogContent>
        {selectedUser && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              {/* Основная информация */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Основная информация
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, width: 56, height: 56 }}>
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedUser.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedUser.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={selectedUser.status} 
                        color={getStatusColor(selectedUser.status) as any}
                        size="small"
                      />
                      <Chip 
                        label={selectedUser.role} 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <CalendarToday fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Регистрация: {format(new Date(selectedUser.createdAt), 'dd.MM.yyyy HH:mm')}
                    </Typography>
                    {selectedUser.lastLogin && (
                      <Typography variant="body2">
                        Последний вход: {format(new Date(selectedUser.lastLogin), 'dd.MM.yyyy HH:mm')}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Подписка */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Подписка
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={selectedUser.subscription.plan.toUpperCase()} 
                        color={getPlanColor(selectedUser.subscription.plan) as any}
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={selectedUser.subscription.status} 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Статус: {selectedUser.subscription.status}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Статистика использования */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Статистика использования
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Всего сообщений
                        </Typography>
                        <Typography variant="h6">
                          {selectedUser.usage.totalMessages.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="body2" color="text.secondary">
                          Всего токенов
                        </Typography>
                        <Typography variant="h6">
                          {selectedUser.usage.totalTokens.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setUserDetailOpen(false)}>
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );

  const EditUserDialog = () => {
    const [editData, setEditData] = useState({
      name: selectedUser?.name || '',
      email: selectedUser?.email || '',
      role: selectedUser?.role || 'user',
      status: selectedUser?.status || 'active',
    });

    const handleSave = () => {
      if (selectedUser) {
        updateUserMutation.mutate({
          userId: selectedUser._id,
          data: editData,
        });
      }
    };

    return (
      <Dialog open={editUserOpen} onClose={() => setEditUserOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Редактировать пользователя
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Имя"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Роль</InputLabel>
              <Select
                value={editData.role}
                onChange={(e) => setEditData({ ...editData, role: e.target.value as any })}
                label="Роль"
              >
                <MenuItem value="user">Пользователь</MenuItem>
                <MenuItem value="moderator">Модератор</MenuItem>
                <MenuItem value="admin">Администратор</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                label="Статус"
              >
                <MenuItem value="active">Активный</MenuItem>
                <MenuItem value="suspended">Заблокированный</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserOpen(false)}>
            Отмена
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={updateUserMutation.isPending}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Управление пользователями
      </Typography>

      {/* Фильтры и поиск */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Поиск по имени или email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Статус</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Статус"
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="active">Активные</MenuItem>
                <MenuItem value="suspended">Заблокированные</MenuItem>
                <MenuItem value="deleted">Удаленные</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>План</InputLabel>
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                label="План"
              >
                <MenuItem value="all">Все</MenuItem>
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="business">Business</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => {/* TODO: добавить создание пользователя */}}
              >
                Добавить
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => exportUsersMutation.mutate()}
                disabled={exportUsersMutation.isPending}
              >
                Экспорт
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Таблица пользователей */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Пользователь</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>План</TableCell>
              <TableCell>Сообщения</TableCell>
              <TableCell>Регистрация</TableCell>
              <TableCell>Последний вход</TableCell>
              <TableCell width={50}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: User) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2 }}>
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.role} 
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.status} 
                    color={getStatusColor(user.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.subscription.plan.toUpperCase()} 
                    color={getPlanColor(user.subscription.plan) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {user.usage.totalMessages.toLocaleString()}
                </TableCell>
                <TableCell>
                  {format(new Date(user.createdAt), 'dd.MM.yyyy')}
                </TableCell>
                <TableCell>
                  {user.lastLogin 
                    ? format(new Date(user.lastLogin), 'dd.MM.yyyy') 
                    : 'Никогда'
                  }
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={(e) => handleMenuOpen(e, user)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`
          }
        />
      </TableContainer>

      {/* Контекстное меню */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewUser}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          Просмотр
        </MenuItem>
        <MenuItem onClick={handleEditUser}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Редактировать
        </MenuItem>
        <MenuItem onClick={handleSuspendUser}>
          <Block fontSize="small" sx={{ mr: 1 }} />
          {selectedUser?.status === 'suspended' ? 'Разблокировать' : 'Заблокировать'}
        </MenuItem>
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      {/* Диалоги */}
      <UserDetailDialog />
      <EditUserDialog />
    </Box>
  );
};

export default UsersPage; 