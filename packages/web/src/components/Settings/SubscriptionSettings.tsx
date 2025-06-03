import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import {
  Check,
  Close,
  Star,
  Business,
  Upgrade,
  Cancel,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';

interface Plan {
  _id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    dailyMessages: number;
    monthlyTokens: number;
    fileUploadSize: number;
    projectsCount: number;
  };
  isActive: boolean;
  isPopular?: boolean;
}

interface UserUsage {
  totalMessages: number;
  totalTokens: number;
  dailyTokens: number;
  dailyMessages: number;
  monthlyTokens: number;
}

const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Получение доступных планов
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async (): Promise<Plan[]> => {
      const response = await apiService.get('/api/v1/subscription/plans');
      return (response.data as any)?.data?.plans || [] as Plan[];
    },
  });

  // Получение использования пользователя
  const { data: usage, isLoading: usageLoading } = useQuery<UserUsage>({
    queryKey: ['user-usage'],
    queryFn: async (): Promise<UserUsage> => {
      const response = await apiService.get('/api/v1/user/usage');
      return response.data as UserUsage;
    },
  });

  // Мутация для смены плана
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiService.post('/api/v1/user/subscription/change', {
        planId,
      });
      return response.data;
    },
    onSuccess: () => {
      setSelectedPlan(null);
      // Можно добавить перезагрузку пользователя
    },
  });

  // Мутация для отмены подписки
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.post('/api/v1/user/subscription/cancel');
      return response.data;
    },
    onSuccess: () => {
      setCancelDialogOpen(false);
    },
  });

  const currentPlan = plans.find(plan => plan.name.toLowerCase() === user?.subscription?.plan);
  const currentPlanLimits = currentPlan?.limits;

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'default';
      case 'pro': return 'primary';
      case 'business': return 'warning';
      default: return 'default';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Info />;
      case 'pro': return <Star />;
      case 'business': return <Business />;
      default: return <Info />;
    }
  };

  const calculateUsagePercent = (used: number, limit: number) => {
    if (limit === -1) return 0; // Безлимитный
    return Math.min((used / limit) * 100, 100);
  };

  const formatUsage = (used: number, limit: number) => {
    if (limit === -1) return `${used.toLocaleString()} / ∞`;
    return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
  };

  if (plansLoading || usageLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Управление подпиской
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Управляйте вашей подпиской и просматривайте использование ресурсов
      </Typography>

      {/* Текущий план */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getPlanIcon(user?.subscription?.plan || 'free')}
              <Box>
                <Typography variant="h6">
                  Текущий план: {currentPlan?.name || 'Free'}
                </Typography>
                <Chip
                  label={user?.subscription?.status || 'активный'}
                  color={user?.subscription?.status === 'active' ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Box>
            {currentPlan && currentPlan.price > 0 && (
              <Typography variant="h6" color="primary">
                ${currentPlan.price}/{currentPlan.interval}
              </Typography>
            )}
          </Box>

          {user?.subscription?.currentPeriodEnd && (
            <Typography variant="body2" color="text.secondary">
              Продлевается: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}
            </Typography>
          )}

          {user?.subscription?.cancelAtPeriodEnd && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Ваша подписка будет отменена в конце текущего периода
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Использование ресурсов */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Использование ресурсов
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Сообщения сегодня
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateUsagePercent(usage?.dailyMessages || 0, currentPlanLimits?.dailyMessages || 50)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">
                {formatUsage(usage?.dailyMessages || 0, currentPlanLimits?.dailyMessages || 50)}
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Токены в месяц
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateUsagePercent(usage?.monthlyTokens || 0, currentPlanLimits?.monthlyTokens || 100000)}
                sx={{ mb: 1 }}
              />
              <Typography variant="body2">
                {formatUsage(usage?.monthlyTokens || 0, currentPlanLimits?.monthlyTokens || 100000)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Доступные планы */}
      <Typography variant="h6" gutterBottom>
        Доступные планы
      </Typography>
      
      <Grid container spacing={2}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan._id}>
            <Card 
              sx={{ 
                height: '100%',
                border: plan.isPopular ? 2 : 1,
                borderColor: plan.isPopular ? 'primary.main' : 'divider',
                position: 'relative'
              }}
            >
              {plan.isPopular && (
                <Chip
                  label="Популярный"
                  color="primary"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }}
                />
              )}
              
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {getPlanIcon(plan.name)}
                  <Typography variant="h6" gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="h4" color="primary" gutterBottom>
                    ${plan.price}
                    <Typography component="span" variant="body2" color="text.secondary">
                      /{plan.interval}
                    </Typography>
                  </Typography>
                </Box>

                <List dense>
                  {plan.features.map((feature, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Check color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Лимиты:
                </Typography>
                <Typography variant="body2">
                  • {plan.limits.dailyMessages === -1 ? 'Безлимитные' : plan.limits.dailyMessages} сообщений/день
                </Typography>
                <Typography variant="body2">
                  • {plan.limits.monthlyTokens === -1 ? 'Безлимитные' : plan.limits.monthlyTokens.toLocaleString()} токенов/месяц
                </Typography>

                <Button
                  fullWidth
                  variant={plan.name.toLowerCase() === user?.subscription?.plan ? "outlined" : "contained"}
                  disabled={plan.name.toLowerCase() === user?.subscription?.plan || changePlanMutation.isPending}
                  sx={{ mt: 2 }}
                  onClick={() => setSelectedPlan(plan._id)}
                  startIcon={plan.name.toLowerCase() !== user?.subscription?.plan ? <Upgrade /> : undefined}
                >
                  {plan.name.toLowerCase() === user?.subscription?.plan ? 'Текущий план' : 'Выбрать план'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Управление подпиской */}
      {user?.subscription?.plan !== 'free' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Управление подпиской
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setCancelDialogOpen(true)}
              disabled={cancelSubscriptionMutation.isPending}
            >
              Отменить подписку
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Диалог подтверждения смены плана */}
      <Dialog
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Подтвердить смену плана</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите сменить план на {plans.find(p => p._id === selectedPlan)?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPlan(null)}>
            Отмена
          </Button>
          <Button
            onClick={() => selectedPlan && changePlanMutation.mutate(selectedPlan)}
            variant="contained"
            disabled={changePlanMutation.isPending}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отмены подписки */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Отменить подписку</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите отменить подписку? Доступ к премиум функциям будет сохранен до конца текущего периода.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>
            Сохранить подписку
          </Button>
          <Button
            onClick={() => cancelSubscriptionMutation.mutate()}
            variant="contained"
            color="error"
            disabled={cancelSubscriptionMutation.isPending}
          >
            Отменить подписку
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionSettings; 