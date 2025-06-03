import React from 'react';
import { Box, CircularProgress, Skeleton, Typography, useTheme, alpha } from '@mui/material';
import { keyframes } from '@mui/system';

export interface LoadingSpinnerProps {
  variant?: 'circular' | 'skeleton' | 'dots' | 'pulse' | 'brain';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
  text?: string;
  fullScreen?: boolean;
}

// Анимации
const brainPulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const dotsAnimation = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

const gradientSpin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const BrainIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="brainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    
    <circle cx="25" cy="25" r="22" fill="none" stroke="url(#brainGradient)" strokeWidth="2"/>
    <circle cx="17" cy="17" r="3" fill="url(#brainGradient)"/>
    <circle cx="33" cy="17" r="3" fill="url(#brainGradient)"/>
    <circle cx="25" cy="25" r="4" fill="url(#brainGradient)"/>
    <circle cx="17" cy="33" r="3" fill="url(#brainGradient)"/>
    <circle cx="33" cy="33" r="3" fill="url(#brainGradient)"/>
    
    <path d="M17 17 L25 25 L33 17" stroke="url(#brainGradient)" strokeWidth="2" fill="none"/>
    <path d="M17 33 L25 25 L33 33" stroke="url(#brainGradient)" strokeWidth="2" fill="none"/>
  </svg>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'circular',
  size = 'medium',
  color = 'primary',
  text,
  fullScreen = false,
}) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: { spinner: 24, text: '0.875rem', padding: 2 },
    medium: { spinner: 40, text: '1rem', padding: 3 },
    large: { spinner: 56, text: '1.125rem', padding: 4 },
  };
  
  const config = sizeMap[size];
  
  const getColor = () => {
    switch (color) {
      case 'primary':
        return theme.palette.primary.main;
      case 'secondary':
        return theme.palette.secondary.main;
      default:
        return theme.palette.text.primary;
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'brain':
        return (
          <Box
            sx={{
              animation: `${brainPulse} 2s ease-in-out infinite`,
            }}
          >
            <BrainIcon size={config.spinner} color={getColor()} />
          </Box>
        );

      case 'dots':
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getColor(),
                  animation: `${dotsAnimation} 1.4s ease-in-out infinite`,
                  animationDelay: `${index * 0.16}s`,
                }}
              />
            ))}
          </Box>
        );

      case 'pulse':
        return (
          <Box
            sx={{
              width: config.spinner,
              height: config.spinner,
              borderRadius: '50%',
              background: `linear-gradient(45deg, ${getColor()} 0%, ${alpha(getColor(), 0.3)} 100%)`,
              animation: `${brainPulse} 1.5s ease-in-out infinite`,
            }}
          />
        );

      case 'skeleton':
        return (
          <Box>
            <Skeleton 
              variant="circular" 
              width={config.spinner} 
              height={config.spinner} 
              sx={{ mb: 1 }}
            />
            {text && (
              <Skeleton 
                variant="text" 
                width={120} 
                height={config.text}
              />
            )}
          </Box>
        );

      default:
        return (
          <Box sx={{ position: 'relative' }}>
            {/* Background circle */}
            <CircularProgress
              size={config.spinner}
              thickness={3}
              sx={{
                color: alpha(getColor(), 0.2),
                position: 'absolute',
              }}
              value={100}
              variant="determinate"
            />
            {/* Animated circle */}
            <Box
              sx={{
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, ${getColor()}, ${theme.palette.secondary.main})`,
                  animation: `${gradientSpin} 2s linear infinite`,
                  zIndex: -1,
                  opacity: 0.3,
                },
              }}
            >
              <CircularProgress
                size={config.spinner}
                thickness={3}
                sx={{
                  color: getColor(),
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  },
                }}
              />
            </Box>
          </Box>
        );
    }
  };

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: text ? 2 : 0,
        p: config.padding,
      }}
    >
      {renderSpinner()}
      
      {text && variant !== 'skeleton' && (
        <Typography
          variant="body2"
          sx={{
            fontSize: config.text,
            color: theme.palette.text.secondary,
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {text}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: alpha(theme.palette.background.default, 0.8),
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;