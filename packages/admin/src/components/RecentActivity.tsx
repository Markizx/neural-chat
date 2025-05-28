import { useQuery } from '@tanstack/react-query';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  PersonAdd,
  Payment,
  Message,
  Warning,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { adminApi } from '@/lib/api';

const mockActivities = [
  {
    _id: '1',
    action: 'user.registered',
    description: 'New user registered',
    adminId: { name: 'System' },
    timestamp: new Date().toISOString(),
  },
  {
    _id: '2',
    action: 'subscription.created',
    description: 'New subscription created',
    adminId: { name: 'System' },
    timestamp: new Date().toISOString(),
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user.registered':
      return <PersonAdd />;
    case 'subscription.created':
      return <Payment />;
    case 'message.sent':
      return <Message />;
    default:
      return <Warning />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'user.registered':
      return 'primary';
    case 'subscription.created':
      return 'success';
    case 'message.sent':
      return 'info';
    default:
      return 'default';
  }
};

export default function RecentActivity() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => adminApi.getAuditLogs({ limit: 10 }),
  });

  const activities = (data as any)?.activities || mockActivities;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <List>
      {activities?.map((activity: any) => (
        <ListItem key={activity._id} alignItems="flex-start">
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: `${getActivityColor(activity.action)}.light` }}>
              {getActivityIcon(activity.action)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={activity.description || activity.action}
            secondary={
              <>
                <Typography component="span" variant="body2" color="text.primary">
                  {activity.adminId?.name || 'System'}
                </Typography>
                {' — '}
                {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}