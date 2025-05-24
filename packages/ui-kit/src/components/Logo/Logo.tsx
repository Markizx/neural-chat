import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { SmartToy } from '@mui/icons-material';

export interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'inherit' | 'white';
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'medium',
  color = 'primary',
  onClick,
}) => {
  const theme = useTheme();

  const sizeMap = {
    small: {
      icon: 24,
      text: 'h6' as const,
      gap: 0.5,
    },
    medium: {
      icon: 32,
      text: 'h5' as const,
      gap: 1,
    },
    large: {
      icon: 48,
      text: 'h4' as const,
      gap: 1.5,
    },
  };

  const colorMap = {
    primary: theme.palette.primary.main,
    inherit: 'inherit',
    white: '#ffffff',
  };

  const config = sizeMap[size];
  const logoColor = colorMap[color];

  if (variant === 'icon') {
    return (
      <SmartToy
        sx={{
          fontSize: config.icon,
          color: logoColor,
          cursor: onClick ? 'pointer' : 'default',
        }}
        onClick={onClick}
      />
    );
  }

  if (variant === 'text') {
    return (
      <Typography
        variant={config.text}
        sx={{
          fontWeight: 700,
          color: logoColor,
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={onClick}
      >
        SmartChat
      </Typography>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={config.gap}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onClick={onClick}
    >
      <SmartToy
        sx={{
          fontSize: config.icon,
          color: logoColor,
        }}
      />
      <Typography
        variant={config.text}
        sx={{
          fontWeight: 700,
          color: logoColor,
          background: color === 'primary' 
            ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
            : undefined,
          backgroundClip: color === 'primary' ? 'text' : undefined,
          WebkitBackgroundClip: color === 'primary' ? 'text' : undefined,
          WebkitTextFillColor: color === 'primary' ? 'transparent' : undefined,
        }}
      >
        SmartChat
      </Typography>
    </Box>
  );
};

export default Logo;