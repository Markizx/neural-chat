import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  useMediaQuery,
} from '@mui/material';
import {
  Home,
  Psychology,
  Folder,
  Settings,
  CreditCard,
  Add,
  AutoAwesome,
  SmartToy,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width: 480px)');

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const menuItems = [
    { text: t('navigation.home'), icon: <Home />, path: '/' },
    { text: 'Claude Chat', icon: <SmartToy />, path: '/chat/claude' },
    { text: 'Grok Chat', icon: <Psychology />, path: '/chat/grok' },
    { text: t('navigation.brainstorm'), icon: <AutoAwesome />, path: '/brainstorm', badge: 'NEW' },
    { text: t('navigation.projects'), icon: <Folder />, path: '/projects' },
  ];

  const bottomMenuItems = [
    { text: t('navigation.subscription'), icon: <CreditCard />, path: '/subscription' },
    { text: t('navigation.settings'), icon: <Settings />, path: '/settings' },
  ];

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(22, 22, 37, 0.95)'
          : 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo Section */}
      <Box sx={{ 
        p: isMobile ? (isSmallMobile ? 2 : 3) : 3, 
        pt: isMobile ? (isSmallMobile ? 8 : 10) : 10,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: isMobile && isSmallMobile ? 40 : 50,
              height: isMobile && isSmallMobile ? 40 : 50,
              borderRadius: '15px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #00d9ff 0%, #6366f1 50%, #ee00ff 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(99, 102, 241, 0.4)'
                : '0 4px 16px rgba(99, 102, 241, 0.25)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -1,
                borderRadius: '15px',
                padding: '1px',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #00d9ff 0%, #6366f1 50%, #ee00ff 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: 0.5,
              },
            }}
          >
            <Typography 
              variant={isMobile && isSmallMobile ? "subtitle1" : "h6"} 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                fontSize: isMobile && isSmallMobile ? '1rem' : undefined,
              }}
            >
              AI
            </Typography>
          </Box>
          <Typography 
            variant={isMobile && isSmallMobile ? "subtitle1" : "h6"} 
            sx={{ 
              fontWeight: 300,
              color: theme.palette.text.primary,
              letterSpacing: '-0.5px',
              fontSize: isMobile && isSmallMobile ? '1.1rem' : undefined,
            }}
          >
            NeuralChat
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleNavigation('/chat/claude')}
          size={isMobile && isSmallMobile ? "medium" : "large"}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            py: isMobile && isSmallMobile ? 1.2 : 1.5,
            borderRadius: '25px',
            fontSize: isMobile && isSmallMobile ? '0.875rem' : '0.9375rem',
            fontWeight: 500,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(124, 58, 237, 0.3)'
              : '0 4px 16px rgba(102, 126, 234, 0.25)',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #6d28d9 0%, #db2777 100%)'
                : 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
              transform: 'translateY(-2px)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 48px rgba(124, 58, 237, 0.4)'
                : '0 8px 24px rgba(102, 126, 234, 0.35)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '25px',
              background: 'inherit',
              filter: 'blur(20px)',
              opacity: 0.4,
              zIndex: -1,
            },
          }}
        >
          ✨ {t('chat.newConversation')}
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
                borderRadius: '15px',
                mx: 1,
                mb: 0.5,
                py: isMobile && isSmallMobile ? 1 : 1.2,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                  transform: 'scaleY(0)',
                  transition: 'transform 0.2s ease',
                },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha('#6366f1', 0.15)
                    : alpha('#6366f1', 0.08),
                  '&::before': {
                    transform: 'scaleY(1)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha('#6366f1', 0.2)
                      : alpha('#6366f1', 0.12),
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: isMobile && isSmallMobile ? 36 : 40, 
                color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                transition: 'color 0.2s ease',
              }}>
                {React.cloneElement(item.icon, {
                  fontSize: isMobile && isSmallMobile ? 'small' : 'medium'
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: isMobile && isSmallMobile ? '0.875rem' : '0.9375rem',
                  fontWeight: location.pathname === item.path ? 500 : 400,
                }}
              />
              {item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{ 
                    height: isMobile && isSmallMobile ? 18 : 20, 
                    fontSize: isMobile && isSmallMobile ? '0.65rem' : '0.7rem',
                    background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ mx: 2, borderColor: alpha(theme.palette.divider, 0.1) }} />

      {/* Bottom Menu */}
      <List sx={{ px: 1, pb: 2 }}>
        {bottomMenuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: '15px',
                mx: 1,
                mb: 0.5,
                py: isMobile && isSmallMobile ? 1 : 1.2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha('#6366f1', 0.15)
                    : alpha('#6366f1', 0.08),
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: isMobile && isSmallMobile ? 36 : 40, 
                color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280' 
              }}>
                {React.cloneElement(item.icon, {
                  fontSize: isMobile && isSmallMobile ? 'small' : 'medium'
                })}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: isMobile && isSmallMobile ? '0.875rem' : '0.9375rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* User Plan Info */}
      {user && user.subscription && (
        <Box sx={{ p: isMobile && isSmallMobile ? 1.5 : 2 }}>
          <Box
            sx={{
              p: isMobile && isSmallMobile ? 1.5 : 2,
              borderRadius: '15px',
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
                animation: 'shimmer 3s infinite',
              },
              '@keyframes shimmer': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(100%)' },
              },
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.mode === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: isMobile && isSmallMobile ? '0.7rem' : '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 0.5,
              }}
            >
              {t('subscription.currentPlan')}
            </Typography>
            <Typography 
              variant={isMobile && isSmallMobile ? "subtitle1" : "h6"} 
              sx={{ 
                textTransform: 'capitalize',
                fontWeight: 600,
                fontSize: isMobile && isSmallMobile ? '1rem' : undefined,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {user.subscription.plan || 'free'}
            </Typography>
            {(user.subscription.plan === 'free' || !user.subscription.plan) && (
              <Button
                size={isMobile && isSmallMobile ? "small" : "small"}
                onClick={() => handleNavigation('/subscription')}
                sx={{ 
                  mt: 1,
                  fontSize: isMobile && isSmallMobile ? '0.7rem' : '0.75rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                {t('subscription.upgrade')}
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;