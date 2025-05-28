import { useQuery } from '@tanstack/react-query';
import { Doughnut } from 'react-chartjs-2';
import { Box, CircularProgress } from '@mui/material';
import { adminApi } from '@/lib/api';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function UsageChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'usage', 'distribution'],
    queryFn: () => adminApi.getUsage('distribution'),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const chartData = {
    labels: ['Claude', 'Grok', 'Brainstorm', 'Projects', 'API'],
    datasets: [
      {
        data: [
          (data as any)?.claude || 0,
          (data as any)?.grok || 0,
          (data as any)?.brainstorm || 0,
          (data as any)?.projects || 0,
          (data as any)?.api || 0,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.label}: ${context.parsed}%`;
          },
        },
      },
    },
  };

  return (
    <Box sx={{ height: 300 }}>
      <Doughnut data={chartData} options={options} />
    </Box>
  );
}