import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Badge,
  useTheme,
  alpha,
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
    { label: 'Главная', icon: <Home />, path: '/' },
    { label: 'Claude', icon: <SmartToy />, path: '/chat/claude' },
    { label: 'Grok', icon: <Psychology />, path: '/chat/grok' },
    { label: 'Штурм', icon: <AutoAwesome />, path: '/brainstorm', badge: true },
    { label: 'Проекты', icon: <Folder />, path: '/projects' },
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
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: '20px 20px 0 0',
        background: theme.palette.mode === 'dark'
          ? alpha('#1a1a2e', 0.95)
          : alpha('#ffffff', 0.98),
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '4px',
          borderRadius: '2px',
          background: alpha(theme.palette.text.secondary, 0.3),
          marginTop: '8px',
        },
      }}
      elevation={0}
    >
      <BottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        sx={{
          background: 'transparent',
          height: 70,
          pt: 1,
          '& .MuiBottomNavigationAction-root': {
            color: theme.palette.mode === 'dark' ? '#6b7280' : '#9ca3af',
            fontSize: '0.75rem',
            minWidth: 'auto',
            padding: '6px 12px 8px',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              transform: 'translateY(-2px)',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              fontWeight: 400,
              marginTop: '4px',
            },
          },
        }}
      >
        {navigationItems.map((item, index) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={
              item.badge ? (
                <Badge
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#ec4899',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      top: 2,
                      right: 2,
                    },
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNavigation; 