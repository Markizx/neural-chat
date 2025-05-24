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
    labels: ['Claude 4 Opus', 'Claude 4 Sonnet', 'Claude 3.5 Sonnet', 'Grok 3', 'Grok 2'],
    datasets: [
      {
        data: data?.distribution || [30, 25, 20, 15, 10],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(99, 102, 241, 0.6)',
          'rgba(99, 102, 241, 0.4)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(236, 72, 153, 0.6)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(99, 102, 241)',
          'rgb(99, 102, 241)',
          'rgb(236, 72, 153)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 1,
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