import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

export interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'inherit' | 'white';
  onClick?: () => void;
  darkMode?: boolean;
}

const NeuralChatIcon: React.FC<{ size: number; darkMode?: boolean }> = ({ size, darkMode }) => (
  <svg width={size} height={size} viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id={`brainGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: darkMode ? '#60a5fa' : '#6366f1', stopOpacity: 1 }} />
        <stop offset="50%" style={{ stopColor: darkMode ? '#a78bfa' : '#8b5cf6', stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: darkMode ? '#f472b6' : '#ec4899', stopOpacity: 1 }} />
      </linearGradient>
      <filter id={`glow-${size}`}>
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <circle cx="25" cy="25" r="24" fill={`url(#brainGradient-${size})`} opacity={darkMode ? "0.2" : "0.1"}/>
    <circle cx="25" cy="25" r="22" fill="none" stroke={`url(#brainGradient-${size})`} strokeWidth="2"/>
    
    <circle cx="17" cy="17" r="3" fill={`url(#brainGradient-${size})`} filter={`url(#glow-${size})`}/>
    <circle cx="33" cy="17" r="3" fill={`url(#brainGradient-${size})`} filter={`url(#glow-${size})`}/>
    <circle cx="25" cy="25" r="4" fill={`url(#brainGradient-${size})`} filter={`url(#glow-${size})`}/>
    <circle cx="17" cy="33" r="3" fill={`url(#brainGradient-${size})`} filter={`url(#glow-${size})`}/>
    <circle cx="33" cy="33" r="3" fill={`url(#brainGradient-${size})`} filter={`url(#glow-${size})`}/>
    
    <path d="M17 17 L25 25 L33 17" stroke={`url(#brainGradient-${size})`} strokeWidth="2" fill="none" opacity={darkMode ? "0.8" : "0.7"}/>
    <path d="M17 33 L25 25 L33 33" stroke={`url(#brainGradient-${size})`} strokeWidth="2" fill="none" opacity={darkMode ? "0.8" : "0.7"}/>
    <path d="M17 17 L17 33" stroke={`url(#brainGradient-${size})`} strokeWidth="1.5" fill="none" opacity={darkMode ? "0.6" : "0.5"}/>
    <path d="M33 17 L33 33" stroke={`url(#brainGradient-${size})`} strokeWidth="1.5" fill="none" opacity={darkMode ? "0.6" : "0.5"}/>
    
    <path d="M33 10 Q38 10 38 15 Q38 20 33 20 L30 20 L31 23 L28 20 Q23 20 23 15 Q23 10 28 10 Z" 
          fill={`url(#brainGradient-${size})`} opacity="0.9"/>
    <circle cx="26" cy="15" r="1" fill={darkMode ? "#1f2937" : "white"}/>
    <circle cx="29" cy="15" r="1" fill={darkMode ? "#1f2937" : "white"}/>
    <circle cx="32" cy="15" r="1" fill={darkMode ? "#1f2937" : "white"}/>
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'medium',
  color = 'primary',
  onClick,
  darkMode,
}) => {
  const theme = useTheme();
  const isDark = darkMode ?? theme.palette.mode === 'dark';

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

  const getTextColor = () => {
    if (color === 'white') return '#ffffff';
    if (color === 'inherit') return 'inherit';
    return isDark ? '#f9fafb' : '#1f2937';
  };

  const config = sizeMap[size];

  if (variant === 'icon') {
    return (
      <Box
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          display: 'inline-flex',
          alignItems: 'center',
        }}
        onClick={onClick}
      >
        <NeuralChatIcon size={config.icon} darkMode={isDark} />
      </Box>
    );
  }

  if (variant === 'text') {
    return (
      <Typography
        variant={config.text}
        sx={{
          fontWeight: 700,
          color: getTextColor(),
          cursor: onClick ? 'pointer' : 'default',
          userSelect: 'none',
          background: color === 'primary' 
            ? `linear-gradient(135deg, ${isDark ? '#60a5fa' : '#6366f1'} 0%, ${isDark ? '#a78bfa' : '#8b5cf6'} 50%, ${isDark ? '#f472b6' : '#ec4899'} 100%)`
            : undefined,
          backgroundClip: color === 'primary' ? 'text' : undefined,
          WebkitBackgroundClip: color === 'primary' ? 'text' : undefined,
          WebkitTextFillColor: color === 'primary' ? 'transparent' : undefined,
        }}
        onClick={onClick}
      >
        NeuralChat
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
      <NeuralChatIcon size={config.icon} darkMode={isDark} />
      <Typography
        variant={config.text}
        sx={{
          fontWeight: 700,
          color: getTextColor(),
          background: color === 'primary' 
            ? `linear-gradient(135deg, ${isDark ? '#60a5fa' : '#6366f1'} 0%, ${isDark ? '#a78bfa' : '#8b5cf6'} 50%, ${isDark ? '#f472b6' : '#ec4899'} 100%)`
            : undefined,
          backgroundClip: color === 'primary' ? 'text' : undefined,
          WebkitBackgroundClip: color === 'primary' ? 'text' : undefined,
          WebkitTextFillColor: color === 'primary' ? 'transparent' : undefined,
        }}
      >
        NeuralChat
      </Typography>
    </Box>
  );
};

export default Logo;