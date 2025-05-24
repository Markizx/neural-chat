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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, pt: 10 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleNavigation('/chat/claude')}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: 1.5,
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
            },
          }}
        >
          New Chat
        </Button>
      </Box>

      <List sx={{ px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.15),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  color="secondary"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ mx: 2 }} />

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
                '&.Mui-selected': {
                  backgroundColor: (theme) =>
                    alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.primary.main, 0.15),
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {user && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.main, 0.05),
              border: (theme) =>
                `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
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