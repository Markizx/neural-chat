import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Button,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Home,
  Chat,
  Psychology,
  Folder,
  Settings,
  CreditCard,
  Add,
  AutoAwesome,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const menuItems = [
    { text: 'Home', icon: <Home />, path: '/' },
    { text: 'Claude Chat', icon: <Chat />, path: '/chat/claude' },
    { text: 'Grok Chat', icon: <Psychology />, path: '/chat/grok' },
    { text: 'Brainstorm Mode', icon: <AutoAwesome />, path: '/brainstorm', badge: 'NEW' },
    { text: 'Projects', icon: <Folder />, path: '/projects' },
  ];

  const bottomMenuItems = [
    { text: 'Subscription', icon: <CreditCard />, path: '/subscription' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Logo Section */}
      <Box sx={{ p: 3, pt: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: '15px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #00d9ff 0%, #6366f1 50%, #ee00ff 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 16px rgba(99, 102, 241, 0.3)'
                : '0 4px 16px rgba(99, 102, 241, 0.2)',
            }}
          >
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              AI
            </Typography>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 300,
              color: theme.palette.text.primary,
            }}
          >
            NexusChat
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleNavigation('/chat/claude')}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 1.5,
            borderRadius: '25px',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 16px rgba(124, 58, 237, 0.3)'
              : '0 4px 16px rgba(99, 102, 241, 0.2)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #6d28d9 0%, #db2777 100%)'
                : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 24px rgba(124, 58, 237, 0.4)'
                : '0 8px 24px rgba(99, 102, 241, 0.3)',
            },
          }}
        >
          ✨ New Chat
        </Button>
      </Box>

      {/* Menu Items */}
      <List sx={{ px: 1, flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.1),
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.2)
                      : alpha(theme.palette.primary.main, 0.15),
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="secondary"
                  sx={{ 
                    height: 20, 
                    fontSize: '0.7rem',
                    background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2 }} />

      {/* Bottom Menu */}
      <List sx={{ px: 1, pb: 2 }}>
        {bottomMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.1),
                  borderLeft: `3px solid ${theme.palette.primary.main}`,
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Plan Info */}
      {user && (
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: '15px',
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.1)
                : alpha(theme.palette.primary.main, 0.05),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Plan
            </Typography>
            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
              {user.subscription.plan}
            </Typography>
            {user.subscription.plan === 'free' && (
              <Button
                size="small"
                color="primary"
                onClick={() => handleNavigation('/subscription')}
                sx={{ mt: 1 }}
              >
                Upgrade
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;