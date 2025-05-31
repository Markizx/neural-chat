import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  Security,
  Payment,
  Analytics,
  Settings,
  History,
  Save,
  Cancel,
  Edit,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import AdminLayout from '../../components/AdminLayout';
import { adminApi } from '../../lib/api';

const UserDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  
  const theme = useTheme();
  const queryClient = useQueryClient();

  // Загрузка данных пользователя
  const { data: userData, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const response = await adminApi.getUserById(id as string);
      return response.data;
    },
    enabled: !!id,
  });

  // Загрузка активности пользователя
  const { data: activityData } = useQuery({
    queryKey: ['admin-user-activity', id],
    queryFn: async () => {
      const response = await adminApi.getUserActivity(id as string);
      return response.data;
    },
    enabled: !!id,
  });

  // Загрузка доступных планов
  const { data: plansData } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const response = await adminApi.getPlans();
      return response.data;
    },
  });

  // Мутация обновления пользователя
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await adminApi.updateUser(id as string, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      setIsEditing(false);
    },
  });

  // Мутация изменения плана
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await adminApi.changeUserPlan(id as string, planId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', id] });
      setChangePlanDialogOpen(false);
    },
  });

  const user = userData?.user;

  if (isLoading) {
    return (
      <AdminLayout title="User Details">
        <Box sx={{ p: 3 }}>
          <LinearProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User Not Found">
        <Box sx={{ p: 3 }}>
          <Alert severity="error">User not found</Alert>
        </Box>
      </AdminLayout>
    );
  }

  const handleSave = () => {
    updateUserMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  return (
    <AdminLayout title={`User: ${user.name || user.email}`}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: theme.palette.primary.main,
                fontSize: '1.5rem',
              }}
            >
              {user.name?.[0] || user.email[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {user.name || 'No Name'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user.email}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Chip
                  label={user.role}
                  color="primary"
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
                <Chip
                  label={user.status}
                  color={user.status === 'active' ? 'success' : 'error'}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={updateUserMutation.isPending}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setIsEditing(true)}
              >
                Edit User
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
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
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person />
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name"
                      value={isEditing ? (formData.name ?? user.name) : user.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      fullWidth
                      disabled={!isEditing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      value={isEditing ? (formData.email ?? user.email) : user.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      fullWidth
                      disabled={!isEditing}
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={isEditing ? (formData.role ?? user.role) : user.role}
                        label="Role"
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="moderator">Moderator</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={isEditing ? (formData.status ?? user.status) : user.status}
                        label="Status"
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="banned">Banned</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isEditing ? (formData.emailVerified ?? user.emailVerified) : user.emailVerified}
                          onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
                          disabled={!isEditing}
                        />
                      }
                      label="Email Verified"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
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
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Analytics />
                  Quick Stats
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Messages"
                      secondary={user.usage?.totalMessages || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Total Tokens"
                      secondary={user.usage?.totalTokens || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Member Since"
                      secondary={format(new Date(user.createdAt), 'MMM d, yyyy')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Last Active"
                      secondary={format(new Date(user.lastActive || user.updatedAt), 'MMM d, yyyy HH:mm')}
                    />
                  </ListItem>
                </List>
              </Paper>
            </motion.div>
          </Grid>

          {/* Subscription Information */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
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
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment />
                  Subscription
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Plan</InputLabel>
                      <Select
                        value={isEditing ? (formData.subscription?.plan ?? user.subscription?.plan ?? 'free') : (user.subscription?.plan || 'free')}
                        label="Plan"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          subscription: { ...formData.subscription, plan: e.target.value }
                        })}
                      >
                        <MenuItem value="free">Free</MenuItem>
                        <MenuItem value="pro">Pro</MenuItem>
                        <MenuItem value="premium">Premium</MenuItem>
                        <MenuItem value="business">Business</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={isEditing ? (formData.subscription?.status ?? user.subscription?.status ?? 'active') : (user.subscription?.status || 'active')}
                        label="Status"
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          subscription: { ...formData.subscription, status: e.target.value }
                        })}
                      >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="canceled">Canceled</MenuItem>
                        <MenuItem value="past_due">Past Due</MenuItem>
                        <MenuItem value="trialing">Trialing</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setChangePlanDialogOpen(true)}
                      >
                        Change Plan
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => {
                          // Suspend subscription logic
                        }}
                      >
                        Suspend
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          // Cancel subscription logic
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
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
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security />
                  Security
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary={user.security?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    />
                    <Chip
                      label={user.security?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      color={user.security?.twoFactorEnabled ? 'success' : 'default'}
                      size="small"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Login Attempts"
                      secondary={user.security?.loginAttempts || 0}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Account Locked"
                      secondary={user.security?.lockUntil ? 'Yes' : 'No'}
                    />
                    <Chip
                      label={user.security?.lockUntil ? 'Locked' : 'Unlocked'}
                      color={user.security?.lockUntil ? 'error' : 'success'}
                      size="small"
                    />
                  </ListItem>
                </List>

                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="outlined">
                    Reset Password
                  </Button>
                  <Button size="small" variant="outlined">
                    Unlock Account
                  </Button>
                  <Button size="small" variant="outlined">
                    Disable 2FA
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Change Plan Dialog */}
        <Dialog
          open={changePlanDialogOpen}
          onClose={() => setChangePlanDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change User Plan</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current Plan: <strong>{user?.subscription?.plan || 'Free'}</strong>
              </Typography>
              <FormControl fullWidth>
                <InputLabel>New Plan</InputLabel>
                <Select
                  value={newPlanId}
                  label="New Plan"
                  onChange={(e) => setNewPlanId(e.target.value)}
                >
                  {plansData?.plans?.map((plan: any) => (
                    <MenuItem key={plan._id} value={plan._id}>
                      {plan.name} - ${plan.price}/{plan.interval}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mt: 2 }}>
                The plan change will take effect immediately and update the user&apos;s limits.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePlanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (newPlanId) {
                  changePlanMutation.mutate(newPlanId);
                }
              }}
              disabled={!newPlanId || changePlanMutation.isPending}
            >
              Change Plan
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default UserDetailPage; 