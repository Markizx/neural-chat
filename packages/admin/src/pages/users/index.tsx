import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  alpha,
  useTheme,
  Grid,
  Card,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  MoreVert,
  Groups,
  TrendingUp,
  TrendingDown,
  Block,
  CheckCircle,
  Download,
  FilterList,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

// Helper function for safe date formatting
const formatDate = (dateValue: string | Date | undefined, fallback: string = 'N/A'): string => {
  if (!dateValue) return fallback;
  const date = new Date(dateValue);
  return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy') : fallback;
};
import { adminApi } from '../../lib/api';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  color: 'primary' | 'success' | 'warning' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => {
  const theme = useTheme();
  const isPositive = trend && trend > 0;

  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
  };

  return (
    <Card
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? alpha('#1a1a2e', 0.6)
          : '#ffffff',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: alpha(colorMap[color], 0.1),
            color: colorMap[color],
          }}
        >
          <Icon />
        </Box>
        {trend !== undefined && (
          <Chip
            size="small"
            icon={isPositive ? <TrendingUp /> : <TrendingDown />}
            label={`${isPositive ? '+' : ''}${trend}%`}
            sx={{
              bgcolor: isPositive
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.error.main, 0.1),
              color: isPositive
                ? theme.palette.success.main
                : theme.palette.error.main,
            }}
          />
        )}
      </Box>
      <Typography color="text.secondary" variant="body2" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Card>
  );
};

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'moderator';
  subscription: {
    plan: string;
    status: string;
    endDate: Date;
  };
  usage: {
    totalMessages: number;
    totalTokens: number;
    dailyMessages: number;
  };
  createdAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'banned' | 'suspended';
}

const UsersManagement: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: '',
    subscriptionPlan: '',
    subscriptionStatus: ''
  });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  });
  
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Загрузка пользователей
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, rowsPerPage, searchQuery, filterStatus],
    queryFn: async () => {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
      };

      console.log('Загружаем пользователей с параметрами:', params);
      const response = await adminApi.getUsers(params);
      console.log('Ответ API getUsers:', response);
      // Проверяем структуру ответа и приводим к нужному формату
      if (response.success && response.data) {
        return response.data;
      }
      // Если ответ не обернут в success/data, возвращаем как есть
      return response;
    },
  });

  // Загрузка статистики пользователей
  const { data: statsData } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: async () => {
      const response = await adminApi.getStats();
      console.log('Ответ API getStats:', response);
      // Проверяем структуру ответа
      if (response.success && response.data) {
        return response.data;
      }
      return response.data || response;
    },
  });

  // Мутации
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: any }) => {
      const response = await adminApi.updateUser(userId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditDialogOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.deleteUser(userId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteDialogOpen(false);
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.createUser(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setAddDialogOpen(false);
      setAddFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active'
      });
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditUser = () => {
    handleMenuClose();
    if (selectedUser) {
      setEditFormData({
        name: selectedUser.name || '',
        email: selectedUser.email || '',
        role: selectedUser.role || 'user',
        status: selectedUser.status || 'active',
        subscriptionPlan: selectedUser.subscription?.plan || 'free',
        subscriptionStatus: selectedUser.subscription?.status || 'inactive'
      });
    }
    setEditDialogOpen(true);
  };

  const handleDeleteUser = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'banned':
        return 'error';
      case 'suspended':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSubscriptionColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return '#FFD700';
      case 'pro':
        return '#C0C0C0';
      case 'basic':
        return '#CD7F32';
      case 'business':
        return '#007bff';
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatCard
              title="Total Users"
              value={statsData?.totalUsers || 0}
              icon={Groups}
              trend={statsData?.userGrowth || 0}
              color="primary"
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <StatCard
              title="Active Users"
              value={statsData?.activeUsers || 0}
              icon={CheckCircle}
              trend={statsData?.activeGrowth || 0}
              color="success"
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <StatCard
              title="Premium Users"
              value={statsData?.premiumUsers || 0}
              icon={TrendingUp}
              color="warning"
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <StatCard
              title="Banned Users"
              value={statsData?.bannedUsers || 0}
              icon={Block}
              color="error"
            />
          </motion.div>
        </Grid>
      </Grid>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: theme.palette.mode === 'dark'
              ? alpha('#1a1a2e', 0.6)
              : '#ffffff',
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Users Management
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={async () => {
                  try {
                    const response = await adminApi.exportUsers();
                    const blob = new Blob([response.data], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                  } catch (error) {
                    console.error('Export failed:', error);
                  }
                }}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5558e8 0%, #7c4fe0 100%)',
                  },
                }}
              >
                Add User
              </Button>
            </Box>
          </Box>

          {/* Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="banned">Banned</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.5),
              }}
            >
              More Filters
            </Button>
          </Box>

          {/* Loading */}
          {isLoading && <LinearProgress sx={{ mb: 2 }} />}

          {/* Error */}
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">
                Ошибка загрузки: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
              </Typography>
            </Box>
          )}



          {/* Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Subscription</TableCell>
                  <TableCell>Usage</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(usersData?.users?.length > 0 || (Array.isArray(usersData) && usersData.length > 0)) ? 
                  (usersData?.users || usersData).map((user: User) => (
                  <TableRow
                    key={user._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {user.name?.[0] || user.email[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.name || 'No name'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role || 'user'}
                        variant="outlined"
                        size="small"
                        sx={{
                          color: user.role === 'admin' ? 'error.main' : user.role === 'moderator' ? 'warning.main' : 'text.secondary',
                          borderColor: user.role === 'admin' ? 'error.main' : user.role === 'moderator' ? 'warning.main' : 'text.secondary',
                        }}
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
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getSubscriptionColor(user.subscription?.plan),
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.subscription?.plan || 'Free'}
                          </Typography>
                        </Box>
                        <Chip
                          label={user.subscription?.status || 'inactive'}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.7rem',
                            height: 18,
                            color: user.subscription?.status === 'active' ? 'success.main' : 'text.secondary',
                            borderColor: user.subscription?.status === 'active' ? 'success.main' : 'text.secondary',
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {user.usage?.totalMessages || 0} messages
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user.usage?.totalTokens || 0} tokens
                        </Typography>
                      </Box>
                    </TableCell>
                                    <TableCell>
                  <Typography variant="body2">
                    {formatDate(user.createdAt)}
                  </Typography>
                </TableCell>
                    <TableCell>
                                              <Typography variant="body2">
                          {formatDate(user.lastActive, 'Never')}
                        </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        {isLoading ? 'Загрузка...' : 'Пользователи не найдены'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={usersData?.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </motion.div>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        {selectedUser?.status === 'active' ? (
          <MenuItem 
            onClick={() => {
              if (selectedUser) {
                updateUserMutation.mutate({
                  userId: selectedUser._id,
                  data: { status: 'suspended' },
                });
              }
              handleMenuClose();
            }}
            sx={{ color: 'warning.main' }}
          >
            <Block fontSize="small" sx={{ mr: 1 }} />
            Suspend User
          </MenuItem>
        ) : (
          <MenuItem 
            onClick={() => {
              if (selectedUser) {
                updateUserMutation.mutate({
                  userId: selectedUser._id,
                  data: { status: 'active' },
                });
              }
              handleMenuClose();
            }}
            sx={{ color: 'success.main' }}
          >
            <CheckCircle fontSize="small" sx={{ mr: 1 }} />
            Activate User
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedUser) {
              // Сброс пароля
              adminApi.resetUserPassword(selectedUser._id).then(() => {
                alert('Password reset successfully! Check console for temp password.');
              }).catch((error) => {
                alert('Failed to reset password: ' + error.message);
              });
            }
            handleMenuClose();
          }}
          sx={{ color: 'info.main' }}
        >
          <CheckCircle fontSize="small" sx={{ mr: 1 }} />
          Reset Password
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
              <TextField
                label="Name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                variant="outlined"
              />
              <TextField
                label="Email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                fullWidth
                variant="outlined"
                type="email"
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                  label="Role"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="banned">Banned</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Subscription Plan</InputLabel>
                <Select
                  value={editFormData.subscriptionPlan}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                  label="Subscription Plan"
                >
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                  <MenuItem value="pro_yearly">Pro Yearly</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Subscription Status</InputLabel>
                <Select
                  value={editFormData.subscriptionStatus}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, subscriptionStatus: e.target.value }))}
                  label="Subscription Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="trial">Trial</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedUser) {
                updateUserMutation.mutate({
                  userId: selectedUser._id,
                  data: editFormData,
                });
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (selectedUser) {
                deleteUserMutation.mutate(selectedUser._id);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="Name"
              value={addFormData.name}
              onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              variant="outlined"
              required
            />
            <TextField
              label="Email"
              value={addFormData.email}
              onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
              fullWidth
              variant="outlined"
              type="email"
              required
            />
            <TextField
              label="Password"
              value={addFormData.password}
              onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
              fullWidth
              variant="outlined"
              type="password"
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={addFormData.role}
                onChange={(e) => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={addFormData.status}
                onChange={(e) => setAddFormData(prev => ({ ...prev, status: e.target.value }))}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              addUserMutation.mutate(addFormData);
            }}
            disabled={!addFormData.email || !addFormData.password}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersManagement;