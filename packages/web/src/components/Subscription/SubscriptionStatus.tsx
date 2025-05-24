import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  CreditCard,
  CalendarToday,
  TrendingUp,
  Cancel,
  CheckCircle,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useAuth } from '../../hooks/useAuth';

const SubscriptionStatus: React.FC = () => {
  const { user } = useAuth();

  // Fetch subscription status
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const response = await apiService.get('/subscription/status');
      return response.data;
    },
  });

  // Create portal session mutation
  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.post('/subscription/create-portal');
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.portalUrl) {
        window.location.href = data.portalUrl;
      }
    },
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.post('/subscription/cancel');
      return response.data;
    },
  });

  // Resume subscription mutation
  const resumeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.post('/subscription/resume');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <Paper sx={{ p: 3, mb: 4 }}>
        <Skeleton variant="rectangular" height={200} />
      </Paper>
    );
  }

  const subscription = subscriptionData?.subscription || user?.subscription;
  const stripeSubscription = subscriptionData?.stripeSubscription;

  if (!subscription || subscription.plan === 'free') {
    return (
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1">
          You're currently on the <strong>Free</strong> plan. Upgrade to unlock more features!
        </Typography>
      </Alert>
    );
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle />;
      case 'canceled':
        return <Cancel />;
      default:
        return <CreditCard />;
    }
  };

  const daysUntilRenewal = subscription.currentPeriodEnd
    ? Math.ceil(
        (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const usagePercentage = user?.usage?.dailyMessages
    ? (user.usage.dailyMessages /
        (subscription.plan === 'pro' ? 100 : Infinity)) *
      100
    : 0;

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Current Subscription
        </Typography>
        <Chip
          label={subscription.status}
          color={getStatusColor(subscription.status)}
          icon={getStatusIcon(subscription.status)}
        />
      </Box>

      <Grid container spacing={3}>
        {/* Plan details */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Plan
            </Typography>
            <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
              {subscription.plan}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Price
            </Typography>
            <Typography variant="h6">
              ${subscription.plan === 'pro' ? '19' : '49'}/month
            </Typography>
          </Box>
        </Grid>

        {/* Billing cycle */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Period
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday fontSize="small" />
              <Typography>
                {subscription.currentPeriodStart &&
                  format(new Date(subscription.currentPeriodStart), 'MMM d')}
                {' - '}
                {subscription.currentPeriodEnd &&
                  format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
              </Typography>
            </Box>
          </Box>
          {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Renews in
              </Typography>
              <Typography variant="h6">{daysUntilRenewal} days</Typography>
            </Box>
          )}
          {subscription.cancelAtPeriodEnd && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              Subscription ends on{' '}
              {format(new Date(subscription.currentPeriodEnd!), 'MMM d, yyyy')}
            </Alert>
          )}
        </Grid>

        {/* Usage */}
        <Grid item xs={12} md={4}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Daily Usage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp fontSize="small" />
              <Typography>
                {user?.usage?.dailyMessages || 0} /{' '}
                {subscription.plan === 'pro' ? '100' : '∞'} messages
              </Typography>
            </Box>
          </Box>
          {subscription.plan === 'pro' && (
            <LinearProgress
              variant="determinate"
              value={Math.min(usagePercentage, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor:
                    usagePercentage > 80 ? 'warning.main' : 'primary.main',
                },
              }}
            />
          )}
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending}
        >
          Manage Billing
        </Button>
        
        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              if (window.confirm('Are you sure you want to cancel your subscription?')) {
                cancelMutation.mutate();
              }
            }}
            disabled={cancelMutation.isPending}
          >
            Cancel Subscription
          </Button>
        )}
        
        {subscription.cancelAtPeriodEnd && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => resumeMutation.mutate()}
            disabled={resumeMutation.isPending}
          >
            Resume Subscription
          </Button>
        )}
      </Box>

      {/* Payment method */}
      {stripeSubscription && stripeSubscription.default_payment_method && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Payment Method
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCard />
            <Typography>
              •••• •••• •••• {stripeSubscription.default_payment_method.card?.last4}
            </Typography>
            <Chip
              label={stripeSubscription.default_payment_method.card?.brand}
              size="small"
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default SubscriptionStatus;