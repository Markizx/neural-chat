import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  useTheme,
  alpha,
  Badge,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Home,
  Chat,
  Psychology,
  AutoAwesome,
  Folder,
  Settings,
  TrendingUp,
  History,
  Star,
  Business,
  Info,
} from '@mui/icons-material';
import { Logo } from '@neuralchat/ui-kit';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const mainMenuItems = [
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
      description: 'Умный помощник Claude',
    },
    { 
      text: 'Grok Chat', 
      icon: <Psychology />, 
      path: '/chat/grok',
      isActive: location.pathname.includes('/chat/grok'),
      description: 'Креативный Grok',
    },
    { 
      text: 'Brainstorm', 
      icon: <AutoAwesome />, 
      path: '/brainstorm',
      isActive: location.pathname.includes('/brainstorm'),
      badge: 'NEW',
      badgeColor: '#ec4899',
      description: 'Мозговой штурм с AI',
    },
  ];

  const workspaceItems = [
    { 
      text: 'Проекты', 
      icon: <Folder />, 
      path: '/projects',
      isActive: location.pathname.includes('/projects'),
      description: 'Мои проекты',
    },
    { 
      text: 'История', 
      icon: <History />, 
      path: '/history',
      isActive: location.pathname.includes('/history'),
      description: 'История чатов',
    },
    { 
      text: 'Аналитика', 
      icon: <TrendingUp />, 
      path: '/analytics',
      isActive: location.pathname.includes('/analytics'),
      description: 'Статистика использования',
    },
  ];

  const bottomItems = [
    { 
      text: 'Настройки', 
      icon: <Settings />, 
      path: '/settings',
      isActive: location.pathname.includes('/settings'),
    },
  ];

  const renderMenuItem = (item: any, showDescription = false) => (
    <ListItem key={item.text} sx={{ p: 0, mb: 0.5 }}>
      <ListItemButton
        onClick={() => handleNavigation(item.path)}
        sx={{
          borderRadius: '12px',
          py: 1.5,
          px: 2,
          minHeight: '52px',
          background: item.isActive
            ? theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)'
            : 'transparent',
          border: item.isActive
            ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
            : '1px solid transparent',
          color: item.isActive
            ? theme.palette.primary.main
            : theme.palette.text.primary,
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            background: item.isActive
              ? theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)'
              : alpha(theme.palette.primary.main, 0.05),
            transform: 'translateX(4px)',
          },
          '&:before': item.isActive ? {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            background: 'linear-gradient(180deg, #6366f1 0%, #ec4899 100%)',
            borderRadius: '0 2px 2px 0',
          } : {},
          transition: 'all 0.2s ease',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: '36px',
            color: 'inherit',
            opacity: item.isActive ? 1 : 0.8,
          }}
        >
          {item.badge ? (
            <Badge
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: item.badgeColor || theme.palette.secondary.main,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                },
                '@keyframes pulse': {
                  '0%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                  '50%': {
                    opacity: 0.5,
                    transform: 'scale(1.1)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'scale(1)',
                  },
                },
              }}
            >
              {item.icon}
            </Badge>
          ) : (
            item.icon
          )}
        </ListItemIcon>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ListItemText
            primary={item.text}
            secondary={showDescription ? item.description : undefined}
            primaryTypographyProps={{
              fontWeight: item.isActive ? 600 : 500,
              fontSize: '0.875rem',
              color: 'inherit',
            }}
            secondaryTypographyProps={{
              fontSize: '0.75rem',
              color: alpha(theme.palette.text.secondary, 0.7),
              mt: 0.5,
            }}
          />
        </Box>
        
        {item.badge && (
          <Chip
            label={item.badge}
            size="small"
            sx={{
              height: '20px',
              fontSize: '0.65rem',
              fontWeight: 600,
              backgroundColor: item.badgeColor || theme.palette.secondary.main,
              color: 'white',
              ml: 1,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        background: 'transparent',
      }}
    >
      {/* Logo Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          mb: 2,
          cursor: 'pointer',
          borderRadius: '16px',
          background: alpha(theme.palette.primary.main, 0.05),
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.1),
            transform: 'scale(1.02)',
          },
          transition: 'all 0.2s ease',
        }}
        onClick={() => handleNavigation('/')}
      >
        <Logo 
          variant="full" 
          size="medium"
          color="primary"
          darkMode={theme.palette.mode === 'dark'}
        />
      </Box>

      {/* Main Navigation */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            px: 2,
            mb: 1,
            display: 'block',
          }}
        >
          Основное
        </Typography>
        <List sx={{ p: 0 }}>
          {mainMenuItems.map((item) => renderMenuItem(item, true))}
        </List>
      </Box>

      <Divider sx={{ my: 2, opacity: 0.5 }} />

      {/* Workspace */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            px: 2,
            mb: 1,
            display: 'block',
          }}
        >
          Рабочее пространство
        </Typography>
        <List sx={{ p: 0 }}>
          {workspaceItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      <Divider sx={{ my: 2, opacity: 0.5 }} />

      {/* Bottom Items */}
      <List sx={{ p: 0 }}>
        {bottomItems.map((item) => renderMenuItem(item))}
      </List>

      {/* Subscription Info */}
      {user && (
        <Card sx={{ 
          mt: 2, 
          background: alpha(theme.palette.primary.main, 0.05),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {user.subscription?.plan === 'pro' ? <Star fontSize="small" color="primary" /> :
               user.subscription?.plan === 'business' ? <Business fontSize="small" color="warning" /> :
               <Info fontSize="small" color="action" />}
              <Typography variant="body2" fontWeight={600}>
                {user.subscription?.plan === 'pro' ? 'Pro Plan' :
                 user.subscription?.plan === 'business' ? 'Business Plan' :
                 'Free Plan'}
              </Typography>
            </Box>
            
            {user.subscription?.plan !== 'free' && user.subscription?.currentPeriodEnd && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                До {new Date(user.subscription.currentPeriodEnd).toLocaleDateString('ru-RU')}
              </Typography>
            )}
            
            {/* Usage indicator for free plan */}
            {user.subscription?.plan === 'free' && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Сообщения сегодня
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((user.usage?.dailyMessages || 0) / 10 * 100, 100)}
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: theme.palette.primary.main,
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {user.usage?.dailyMessages || 0}/10
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 1 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.primary.main,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => handleNavigation('/settings')}
              >
                Управление подпиской
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* User Info */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: '12px',
          background: alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          Добро пожаловать! 👋
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Версия 2.0 Beta
        </Typography>
      </Box>
    </Box>
  );
};

export default Sidebar;