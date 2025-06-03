import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  alpha,
  Box,
} from '@mui/material';
import {
  Home,
  SmartToy,
  Psychology,
  AutoAwesome,
  Folder,
} from '@mui/icons-material';

const MobileBottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const navigationItems = [
    { 
      label: 'Главная', 
      icon: <Home />, 
      path: '/',
      color: '#6366f1',
    },
    { 
      label: 'Claude', 
      icon: <SmartToy />, 
      path: '/chat/claude',
      color: '#059669',
    },
    { 
      label: 'Grok', 
      icon: <Psychology />, 
      path: '/chat/grok',
      color: '#dc2626',
    },
    { 
      label: 'Штурм', 
      icon: <AutoAwesome />, 
      path: '/brainstorm', 
      badge: true,
      color: '#ec4899',
    },
    { 
      label: 'Проекты', 
      icon: <Folder />, 
      path: '/projects',
      color: '#7c3aed',
    },
  ];

  const getCurrentValue = () => {
    const currentPath = location.pathname;
    const item = navigationItems.find(item => {
      if (item.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(item.path);
    });
    return item ? navigationItems.indexOf(item) : 0;
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const item = navigationItems[newValue];
    if (item) {
      navigate(item.path);
    }
  };

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        background: theme.palette.mode === 'dark'
          ? 'rgba(15, 15, 20, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          opacity: 0.6,
        },
      }}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          background: 'transparent',
          height: 64,
          pt: 1,
          pb: 0.5,
          '& .MuiBottomNavigationAction-root': {
            color: alpha(theme.palette.text.secondary, 0.6),
            fontSize: '0.7rem',
            minWidth: 'auto',
            maxWidth: 80,
            padding: '4px 8px 6px',
            borderRadius: '12px',
            margin: '0 2px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            '&.Mui-selected': {
              color: 'transparent', // Скрываем стандартный цвет
              transform: 'translateY(-4px) scale(1.1)',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
              },
              '&:before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: alpha(theme.palette.primary.main, 0.1),
                zIndex: -1,
              },
            },
            '&:hover:not(.Mui-selected)': {
              color: alpha(theme.palette.text.primary, 0.8),
              transform: 'translateY(-1px)',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.65rem',
              fontWeight: 500,
              marginTop: '2px',
              transition: 'all 0.2s ease',
            },
            '& .MuiSvgIcon-root': {
              fontSize: '1.3rem',
              transition: 'all 0.2s ease',
            },
          },
        }}
      >
        {navigationItems.map((item, index) => {
          const isSelected = getCurrentValue() === index;
          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={
                <Box sx={{ position: 'relative' }}>
                  {item.badge ? (
                    <Badge
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: '#ec4899',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          top: 0,
                          right: 2,
                          animation: isSelected ? 'none' : 'pulse 2s infinite',
                        },
                        '@keyframes pulse': {
                          '0%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                          '50%': {
                            opacity: 0.5,
                            transform: 'scale(1.2)',
                          },
                          '100%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          color: isSelected ? item.color : 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {item.icon}
                      </Box>
                    </Badge>
                  ) : (
                    <Box
                      sx={{
                        color: isSelected ? item.color : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {item.icon}
                    </Box>
                  )}
                </Box>
              }
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNavigation; 