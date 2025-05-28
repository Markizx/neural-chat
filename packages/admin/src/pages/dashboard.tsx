import { Grid, Paper, Typography, Box } from '@mui/material';
import AdminLayout from '@/components/AdminLayout';
import StatsCard from '@/components/StatsCard';
import RevenueChart from '@/components/charts/RevenueChart';
import UsageChart from '@/components/charts/UsageChart';
import RecentActivity from '@/components/RecentActivity';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  People,
  AttachMoney,
  Message,
  TrendingUp,
} from '@mui/icons-material';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout title="Dashboard">
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={stats?.data?.totalUsers || 0}
            icon={<People />}
            change="+12%"
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats?.data?.monthlyRevenue || 0}`}
            icon={<AttachMoney />}
            change="+23%"
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Messages"
            value={stats?.data?.totalMessages || 0}
            icon={<Message />}
            change="+18%"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Subscriptions"
            value={stats?.data?.activeSubscriptions || 0}
            icon={<TrendingUp />}
            change="+15%"
            color="warning"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Overview
            </Typography>
            <RevenueChart />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Usage Statistics
            </Typography>
            <UsageChart />
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <RecentActivity />
          </Paper>
        </Grid>
      </Grid>
    </AdminLayout>
  );
}