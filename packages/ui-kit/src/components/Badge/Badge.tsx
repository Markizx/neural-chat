import React from 'react';
import { Badge as MuiBadge, BadgeProps as MuiBadgeProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface BadgeProps extends Omit<MuiBadgeProps, 'variant'> {
  variant?: 'standard' | 'dot';
  size?: 'small' | 'medium' | 'large';
  pulse?: boolean;
  showNumber?: boolean;
}

const StyledBadge = styled(MuiBadge)<{ pulse?: boolean }>(({ pulse }) => ({
  '& .MuiBadge-badge': {
    ...(pulse && {
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    }),
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

export const Badge: React.FC<BadgeProps> = ({
  variant = 'standard',
  size = 'medium',
  pulse = false,
  showNumber = false,
  badgeContent,
  ...props
}) => {
  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { 
          sx: { 
            '& .MuiBadge-badge': { 
              fontSize: '0.625rem',
              height: 16,
              minWidth: 16,
            } 
          } 
        };
      case 'large':
        return { 
          sx: { 
            '& .MuiBadge-badge': { 
              fontSize: '0.875rem',
              height: 24,
              minWidth: 24,
            } 
          } 
        };
      default:
        return {};
    }
  };

  const sizeProps = getSizeProps();

  return (
    <StyledBadge
      {...props}
      {...sizeProps}
      pulse={pulse}
      variant={variant}
      badgeContent={variant === 'dot' ? undefined : (showNumber ? badgeContent : undefined)}
    />
  );
};

export default Badge;