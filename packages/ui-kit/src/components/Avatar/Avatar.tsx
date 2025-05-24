import React from 'react';
import { Avatar as MuiAvatar, AvatarProps as MuiAvatarProps, Badge, BadgeProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface AvatarProps extends MuiAvatarProps {
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  status?: 'online' | 'offline' | 'away' | 'busy';
  showBadge?: boolean;
  badgeProps?: BadgeProps;
}

const StyledBadge = styled(Badge)<{ status?: string }>(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: 
      status === 'online' ? '#44b700' :
      status === 'away' ? '#FFA500' :
      status === 'busy' ? '#f44336' :
      '#757575',
    color: 
      status === 'online' ? '#44b700' :
      status === 'away' ? '#FFA500' :
      status === 'busy' ? '#f44336' :
      '#757575',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: status === 'online' ? 'ripple 1.2s infinite ease-in-out' : 'none',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

const sizeMap = {
  small: { width: 32, height: 32, fontSize: '0.875rem' },
  medium: { width: 40, height: 40, fontSize: '1rem' },
  large: { width: 56, height: 56, fontSize: '1.25rem' },
  xlarge: { width: 80, height: 80, fontSize: '1.5rem' },
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'medium',
  status,
  showBadge = false,
  badgeProps,
  src,
  sx,
  ...props
}) => {
  const getInitials = (name?: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const avatarElement = (
    <MuiAvatar
      src={src}
      sx={{
        ...sizeMap[size],
        bgcolor: !src ? 'primary.main' : undefined,
        ...sx,
      }}
      {...props}
    >
      {!src && getInitials(name)}
    </MuiAvatar>
  );

  if (showBadge && status) {
    return (
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        status={status}
        {...badgeProps}
      >
        {avatarElement}
      </StyledBadge>
    );
  }

  return avatarElement;
};

export default Avatar;