import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'active' | 'inactive' | 'error' | 'warning' | 'success';
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dot' | 'chip' | 'text';
  pulse?: boolean;
}

const StatusDot = styled(Box)<{ status: string; size: string; pulse?: boolean }>(
  ({ theme, status, size, pulse }) => {
    const colors = {
      online: '#44b700',
      offline: '#757575',
      away: '#FFA500',
      busy: '#f44336',
      active: '#44b700',
      inactive: '#757575',
      error: theme.palette.error.main,
      warning: theme.palette.warning.main,
      success: theme.palette.success.main,
    };

    const sizes = {
      small: 8,
      medium: 12,
      large: 16,
    };

    return {
      width: sizes[size as keyof typeof sizes],
      height: sizes[size as keyof typeof sizes],
      borderRadius: '50%',
      backgroundColor: colors[status as keyof typeof colors],
      position: 'relative',
      display: 'inline-block',
      ...(pulse && {
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: colors[status as keyof typeof colors],
          animation: 'pulse 2s infinite',
        },
        '@keyframes pulse': {
          '0%': {
            transform: 'scale(1)',
            opacity: 1,
          },
          '100%': {
            transform: 'scale(2)',
            opacity: 0,
          },
        },
      }),
    };
  }
);

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'medium',
  variant = 'dot',
  pulse = false,
}) => {
  const getStatusLabel = () => {
    if (label) return label;
    
    const labels = {
      online: 'Online',
      offline: 'Offline',
      away: 'Away',
      busy: 'Busy',
      active: 'Active',
      inactive: 'Inactive',
      error: 'Error',
      warning: 'Warning',
      success: 'Success',
    };
    
    return labels[status];
  };

  const getChipColor = () => {
    const colorMap = {
      online: 'success',
      offline: 'default',
      away: 'warning',
      busy: 'error',
      active: 'success',
      inactive: 'default',
      error: 'error',
      warning: 'warning',
      success: 'success',
    };
    
    return colorMap[status] as any;
  };

  if (variant === 'chip') {
    return (
      <Chip
        label={getStatusLabel()}
        color={getChipColor()}
        size={size === 'large' ? 'medium' : 'small'}
        variant="filled"
      />
    );
  }

  if (variant === 'text') {
    const textSizes = {
      small: 'caption',
      medium: 'body2',
      large: 'body1',
    };

    return (
      <Box display="flex" alignItems="center" gap={0.5}>
        <StatusDot status={status} size={size} pulse={pulse} />
        <Typography variant={textSizes[size] as any} color="text.secondary">
          {getStatusLabel()}
        </Typography>
      </Box>
    );
  }

  return <StatusDot status={status} size={size} pulse={pulse} />;
};

export default StatusIndicator;