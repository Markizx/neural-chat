import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Message,
  AttachMoney,
  Computer,
  Warning,
  CheckCircle,
  Error,
  Schedule,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';

// Helper function for safe date formatting
const formatDate = (dateValue: string | Date | undefined, formatStr: string = 'HH:mm:ss', fallback: string = 'N/A'): string => {
  if (!dateValue) return fallback;
  const date = new Date(dateValue);
  return !isNaN(date.getTime()) ? format(date, formatStr) : fallback;
};
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../lib/api';

const Dashboard: React.FC = () => {
  // Загружаем статистику
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
  });

  // Загружаем аналитику
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminApi.getAnalytics('7d'),
  });

  // Загружаем статистику использования
  const { data: usageData, isLoading: usageLoading } = useQuery({
    queryKey: ['admin', 'usage'],
    queryFn: () => adminApi.getUsageStats({
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    }),
  });

  // Загружаем здоровье системы
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  if (statsLoading || analyticsLoading || usageLoading || healthLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Обрабатываем разные структуры ответов
  const stats = statsData?.success ? statsData.data : (statsData?.data || statsData || {});
  const analytics = analyticsData?.success ? analyticsData.data : (analyticsData?.data || analyticsData || {});
  const usage = usageData?.success ? usageData.data : (usageData?.data || usageData || {});
  const health = healthData?.success ? healthData.data : (healthData?.data || healthData || {});

  // Данные для графиков
  const userGrowthData = analytics.userGrowth?.map((item: any) => ({
    date: format(new Date(item.date), 'MM/dd'),
    users: item.count,
    newUsers: item.newUsers || 0,
  })) || [];

  const messageVolumeData = analytics.messageVolume?.map((item: any) => ({
    date: format(new Date(item.date), 'MM/dd'),
    messages: item.count,
    tokens: item.tokens || 0,
  })) || [];

  const modelUsageData = [
    { name: 'Claude', value: usage.modelStats?.claude || 0, color: '#6366f1' },
    { name: 'Grok', value: usage.modelStats?.grok || 0, color: '#ec4899' },
    { name: 'Brainstorm', value: usage.modelStats?.brainstorm || 0, color: '#10b981' },
  ];

  const subscriptionData = [
    { name: 'Free', value: stats.subscriptions?.free || 0, color: '#94a3b8' },
    { name: 'Pro', value: stats.subscriptions?.pro || 0, color: '#3b82f6' },
    { name: 'Business', value: stats.subscriptions?.business || 0, color: '#10b981' },
  ];

  // Статус карты
  const StatCard = ({ title, value, change, icon: Icon, color = 'primary' }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value?.toLocaleString() || '0'}
            </Typography>
            {change && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp 
                  sx={{ 
                    color: change > 0 ? 'success.main' : 'error.main',
                    fontSize: 16,
                    mr: 0.5
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: change > 0 ? 'success.main' : 'error.main' 
                  }}
                >
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: `${color}.main`, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Админ Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Обзор системы и ключевые метрики
      </Typography>

      {/* Статус системы */}
      {health.status && (
        <Alert 
          severity={health.status === 'healthy' ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
          action={
            <Button size="small" onClick={() => window.location.reload()}>
              Обновить
            </Button>
          }
        >
          Статус системы: {health.status === 'healthy' ? 'Система работает нормально' : 'Обнаружены проблемы'}
          {health.issues?.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {health.issues.map((issue: string, index: number) => (
                <Typography key={index} variant="body2">
                  • {issue}
                </Typography>
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* Основная статистика */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Всего пользователей"
            value={stats.totalUsers}
            change={analytics.userGrowthRate}
            icon={People}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Сообщений сегодня"
            value={stats.todayMessages}
            change={analytics.messageGrowthRate}
            icon={Message}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Доход за месяц"
            value={`$${stats.monthlyRevenue || 0}`}
            change={analytics.revenueGrowthRate}
            icon={AttachMoney}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Активных сессий"
            value={stats.activeSessions}
            icon={Computer}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Графики */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Рост пользователей */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Рост пользователей (последние 7 дней)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      name="Всего пользователей"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newUsers" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Новые пользователи"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Распределение подписок */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Подписки
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {subscriptionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {subscriptionData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        bgcolor: item.color, 
                        borderRadius: 1, 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2">
                      {item.name}: {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Объем сообщений */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Объем сообщений и токенов
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messageVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="messages" fill="#6366f1" name="Сообщения" />
                    <Bar yAxisId="right" dataKey="tokens" fill="#ec4899" name="Токены (x1000)" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Использование моделей */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Популярность моделей
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelUsageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {modelUsageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2 }}>
                {modelUsageData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        bgcolor: item.color, 
                        borderRadius: 1, 
                        mr: 1 
                      }} 
                    />
                    <Typography variant="body2">
                      {item.name}: {item.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Недавняя активность и система */}
      <Grid container spacing={3}>
        {/* Последние логи */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Последние события
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List dense>
                {health.recentLogs?.slice(0, 5).map((log: any, index: number) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {log.level === 'error' ? (
                        <Error color="error" />
                      ) : log.level === 'warning' ? (
                        <Warning color="warning" />
                      ) : (
                        <CheckCircle color="success" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={log.message}
                      secondary={formatDate(log.timestamp, 'HH:mm:ss')}
                    />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText primary="Нет недавних событий" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Системная информация */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Система
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Версия API
                  </Typography>
                  <Typography variant="body1">
                    {health.version || '1.0.0'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Время работы
                  </Typography>
                  <Typography variant="body1">
                    {health.uptime || 'Неизвестно'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    База данных
                  </Typography>
                  <Chip 
                    label={health.database?.status || 'Подключено'} 
                    color={health.database?.status === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Redis
                  </Typography>
                  <Chip 
                    label={health.redis?.status || 'Подключено'} 
                    color={health.redis?.status === 'connected' ? 'success' : 'error'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Память
                  </Typography>
                  <Typography variant="body1">
                    {health.memory?.used || 'N/A'} / {health.memory?.total || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;