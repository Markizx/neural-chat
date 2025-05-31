import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  alpha,
  useTheme,
  Alert,
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Cancel,
  Refresh,
  Download,
  TrendingUp,
  AttachMoney,
  People,
  Warning,
  TrendingDown,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminApi } from '../lib/api';

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

interface Subscription {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  plan: 'free' | 'pro' | 'premium' | 'business';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  provider: 'stripe' | 'apple' | 'google';
  customerId: string;
  subscriptionId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionsPage: NextPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [newPlanId, setNewPlanId] = useState('');
  const [extensionDays, setExtensionDays] = useState(30);
  const [refundAmount, setRefundAmount] = useState(0);

  const theme = useTheme();
  const queryClient = useQueryClient();

  // Загрузка подписок
  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', page, rowsPerPage, searchQuery, filterStatus, filterPlan],
    queryFn: async () => {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPlan !== 'all' && { plan: filterPlan }),
      };
      
      const response = await adminApi.getSubscriptions(params);
      console.log('Подписки:', response);
      // Проверяем структуру ответа
      if (response.success && response.data) {
        return response.data;
      }
      return response.data || response;
    },
  });

  // Загрузка статистики подписок
  const { data: statsData } = useQuery({
    queryKey: ['admin-subscriptions-stats'],
    queryFn: async () => {
      const response = await adminApi.getSubscriptionStats();
      console.log('Статистика подписок:', response);
      // Проверяем структуру ответа
      if (response.success && response.data) {
        return response.data;
      }
      return response.data || response;
    },
  });

  // Загрузка доступных планов
  const { data: plansData } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const response = await adminApi.getPlans();
      console.log('Планы:', response);
      // Проверяем структуру ответа
      if (response.success && response.data) {
        return response.data;
      }
      return response.data || response;
    },
  });

  // Мутации
  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, data }: { subscriptionId: string; data: any }) => {
      const response = await adminApi.updateSubscription(subscriptionId, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setEditDialogOpen(false);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await adminApi.cancelSubscription(subscriptionId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setCancelDialogOpen(false);
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const response = await adminApi.changeUserPlan(userId, planId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setChangePlanDialogOpen(false);
    },
  });

  const extendSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, days }: { subscriptionId: string; days: number }) => {
      const response = await adminApi.extendSubscription(subscriptionId, days);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setExtendDialogOpen(false);
    },
  });

  const refundSubscriptionMutation = useMutation({
    mutationFn: async ({ subscriptionId, amount }: { subscriptionId: string; amount?: number }) => {
      const response = await adminApi.refundSubscription(subscriptionId, amount);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setRefundDialogOpen(false);
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, subscription: Subscription) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubscription(subscription);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditSubscription = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleCancelSubscription = () => {
    handleMenuClose();
    setCancelDialogOpen(true);
  };

  const handleChangePlan = () => {
    handleMenuClose();
    setChangePlanDialogOpen(true);
  };

  const handleExtendSubscription = () => {
    handleMenuClose();
    setExtendDialogOpen(true);
  };

  const handleRefundSubscription = () => {
    handleMenuClose();
    setRefundDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
        return 'warning';
      case 'canceled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'premium':
        return '#FFD700';
      case 'pro':
        return '#C0C0C0';
      case 'business':
        return '#CD7F32';
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StatCard
                title="Total Subscriptions"
                value={statsData?.totalSubscriptions || 0}
                icon={People}
                trend={statsData?.subscriptionGrowth || 0}
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
                title="Active Subscriptions"
                value={statsData?.activeSubscriptions || 0}
                icon={TrendingUp}
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
                title="Monthly Revenue"
                value={`$${statsData?.monthlyRevenue || 0}`}
                icon={AttachMoney}
                trend={statsData?.revenueGrowth || 0}
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
                title="Canceled Subscriptions"
                value={statsData?.canceledSubscriptions || 0}
                icon={Warning}
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
                Subscriptions Management
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Download />}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                }}
              >
                Export
              </Button>
            </Box>

            {/* Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search subscriptions..."
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
                  <MenuItem value="trialing">Trialing</MenuItem>
                  <MenuItem value="past_due">Past Due</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Plan</InputLabel>
                <Select
                  value={filterPlan}
                  label="Plan"
                  onChange={(e) => setFilterPlan(e.target.value)}
                >
                  <MenuItem value="all">All Plans</MenuItem>
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="pro">Pro</MenuItem>
                  <MenuItem value="premium">Premium</MenuItem>
                  <MenuItem value="business">Business</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Loading */}
            {isLoading && <LinearProgress sx={{ mb: 2 }} />}

            {/* Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptionsData?.subscriptions?.map((subscription: Subscription) => (
                    <TableRow
                      key={subscription._id}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {subscription.user?.name || 'No name'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {subscription.user?.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: getPlanColor(subscription.plan),
                            }}
                          />
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {subscription.plan}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subscription.status}
                          color={getStatusColor(subscription.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ${subscription.amount || 0}/{subscription.plan === 'business' ? 'year' : 'month'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {format(new Date(subscription.currentPeriodStart), 'MMM d')} - {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                          </Typography>
                          {subscription.cancelAtPeriodEnd && (
                            <Typography variant="caption" color="warning.main">
                              Cancels at period end
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subscription.provider}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, subscription)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={subscriptionsData?.total || 0}
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
          <MenuItem onClick={handleEditSubscription}>
            <Edit fontSize="small" sx={{ mr: 1 }} />
            Edit Subscription
          </MenuItem>
          <MenuItem onClick={handleChangePlan}>
            <TrendingUp fontSize="small" sx={{ mr: 1 }} />
            Change Plan
          </MenuItem>
          <MenuItem onClick={handleExtendSubscription}>
            <Refresh fontSize="small" sx={{ mr: 1 }} />
            Extend Subscription
          </MenuItem>
          <MenuItem onClick={handleRefundSubscription}>
            <AttachMoney fontSize="small" sx={{ mr: 1 }} />
            Process Refund
          </MenuItem>
          <MenuItem onClick={handleCancelSubscription} sx={{ color: 'error.main' }}>
            <Cancel fontSize="small" sx={{ mr: 1 }} />
            Cancel Subscription
          </MenuItem>
        </Menu>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogContent>
            {/* Edit form here */}
            <Typography>Subscription editing form will be implemented here.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* Change Plan Dialog */}
        <Dialog
          open={changePlanDialogOpen}
          onClose={() => setChangePlanDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current Plan: <strong>{selectedSubscription?.plan}</strong>
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
                The plan change will take effect immediately. Billing will be prorated.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePlanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (selectedSubscription && newPlanId) {
                  changePlanMutation.mutate({
                    userId: selectedSubscription.user._id,
                    planId: newPlanId,
                  });
                }
              }}
              disabled={!newPlanId || changePlanMutation.isPending}
            >
              Change Plan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Extend Subscription Dialog */}
        <Dialog
          open={extendDialogOpen}
          onClose={() => setExtendDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Extend Subscription</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current End Date: <strong>
                  {selectedSubscription && format(new Date(selectedSubscription.currentPeriodEnd), 'MMM d, yyyy')}
                </strong>
              </Typography>
              <TextField
                label="Extension Days"
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(Number(e.target.value))}
                fullWidth
                inputProps={{ min: 1, max: 365 }}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                This will extend the subscription by {extensionDays} days without additional charge.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExtendDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (selectedSubscription) {
                  extendSubscriptionMutation.mutate({
                    subscriptionId: selectedSubscription._id,
                    days: extensionDays,
                  });
                }
              }}
              disabled={extendSubscriptionMutation.isPending}
            >
              Extend Subscription
            </Button>
          </DialogActions>
        </Dialog>

        {/* Refund Dialog */}
        <Dialog
          open={refundDialogOpen}
          onClose={() => setRefundDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Process Refund</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Subscription Amount: <strong>${selectedSubscription?.amount || 0}</strong>
              </Typography>
              <TextField
                label="Refund Amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                fullWidth
                inputProps={{ 
                  min: 0, 
                  max: selectedSubscription?.amount || 0,
                  step: 0.01 
                }}
                helperText="Leave empty for full refund"
              />
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action will process a refund and may cancel the subscription.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                if (selectedSubscription) {
                  refundSubscriptionMutation.mutate({
                    subscriptionId: selectedSubscription._id,
                    amount: refundAmount || undefined,
                  });
                }
              }}
              disabled={refundSubscriptionMutation.isPending}
            >
              Process Refund
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
        >
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to cancel this subscription? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (selectedSubscription) {
                  cancelSubscriptionMutation.mutate(selectedSubscription._id);
                }
              }}
            >
              Cancel Subscription
            </Button>
          </DialogActions>
        </Dialog>
    </Box>
  );
};

export default SubscriptionsPage; 