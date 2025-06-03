import React from 'react';
import { Box, useTheme } from '@mui/material';

interface PageContainerProps {
  children: React.ReactNode;
  fullHeight?: boolean;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  fullHeight = true,
  className = ''
}) => {
  const theme = useTheme();

  return (
    <Box
      className={`page-container ${className}`}
      sx={{
        height: fullHeight ? '100%' : 'auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: fullHeight ? 'hidden' : 'auto',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(31,41,55,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.95) 100%)',
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );
};

export default PageContainer; 