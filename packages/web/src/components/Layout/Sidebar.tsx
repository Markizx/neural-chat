import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Chat,
  Psychology,
  AutoAwesome,
  Folder,
  Settings,
  Add,
  Home,
  Psychology as BrainIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const menuItems = [
    { 
      text: 'Главная', 
      icon: <Home />, 
      path: '/',
      isActive: location.pathname === '/',
    },
    { 
      text: 'Claude Chat', 
      icon: <Chat />, 
      path: '/chat/claude',
      isActive: location.pathname.includes('/chat/claude'),
    },
    { 
      text: 'Grok Chat', 
      icon: <Psychology />, 
      path: '/chat/grok',
      isActive: location.pathname.includes('/chat/grok'),
    },
    { 
      text: 'Brainstorm Mode', 
      icon: <AutoAwesome />, 
      path: '/brainstorm',
      isActive: location.pathname.includes('/brainstorm'),
      badge: 'NEW',
    },
    { 
      text: 'Проекты', 
      icon: <Folder />, 
      path: '/projects',
      isActive: location.pathname.includes('/projects'),
    },
    { 
      text: 'Настройки', 
      icon: <Settings />, 
      path: '/settings',
      isActive: location.pathname.includes('/settings'),
    },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          p: 1.5,
          background: theme.palette.mode === 'dark'
            ? 'rgba(139, 92, 246, 0.1)'
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
          borderRadius: '12px',
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(139, 92, 246, 0.2)'
            : 'rgba(139, 92, 246, 0.15)'
          }`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
          }}
          onClick={() => handleNavigation('/')}
        >
          <BrainIcon 
            sx={{ 
              fontSize: 32, 
              color: '#8b5cf6',
            }} 
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            NeuralChat
          </Typography>
        </Box>
      </Box>

      {/* New Chat Button */}
      <Button
        fullWidth
        variant="contained"
        startIcon={<Add />}
        onClick={() => handleNavigation('/')}
        sx={{
          mb: 3,
          py: 1.75,
          px: 2.5,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          borderRadius: '12px',
          fontWeight: 500,
          fontSize: '15px',
          textTransform: 'none',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(139, 92, 246, 0.35)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        Новая беседа
      </Button>

      {/* Navigation Menu */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => (
            <ListItem key={item.text} sx={{ p: 0, mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: '10px',
                  py: 1.5,
                  px: 2,
                  minHeight: '48px',
                  background: item.isActive
                    ? theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.15)'
                      : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)'
                    : 'transparent',
                  border: item.isActive
                    ? `1px solid ${theme.palette.mode === 'dark'
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(139, 92, 246, 0.2)'
                    }`
                    : '1px solid transparent',
                  color: item.isActive
                    ? '#8b5cf6'
                    : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : '#4b5563',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.04)',
                    color: theme.palette.mode === 'dark' ? 'white' : '#1a1a1a',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: '32px',
                    color: 'inherit',
                    opacity: 0.8,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '14px',
                    fontWeight: item.isActive ? 500 : 400,
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                      color: 'white',
                      ml: 'auto',
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Bottom Section */}
      <Box
        sx={{
          mt: 'auto',
          pt: 3,
          borderTop: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.06)'
          }`,
        }}
      >
        {/* Plan Info */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            mb: 2,
            background: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.06)'
            }`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.6)'
                : '#6b7280',
            }}
          >
            Текущий план
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: '#8b5cf6',
            }}
          >
            Free
          </Typography>
        </Box>

        {/* Upgrade Link */}
        <Button
          fullWidth
          variant="text"
          onClick={() => handleNavigation('/subscription')}
          sx={{
            py: 1,
            color: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.6)'
              : '#6b7280',
            fontSize: '13px',
            textTransform: 'none',
            '&:hover': {
              color: '#8b5cf6',
              background: 'transparent',
            },
            transition: 'color 0.2s ease',
          }}
        >
          Обновить план →
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;