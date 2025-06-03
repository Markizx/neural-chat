import React from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Notifications,
  Settings,
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { Logo } from '@neuralchat/ui-kit';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleTheme } = useAppTheme();

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        height: '72px',
        flexShrink: 0,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(15, 15, 20, 0.9) 0%, rgba(30, 30, 40, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(250, 250, 251, 0.9) 100%)',
      }}
    >
      <Toolbar sx={{ 
        height: '72px', 
        minHeight: '72px !important',
        px: { xs: 2, sm: 3 },
        position: 'relative',
      }}>
        {/* Decorative gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
            zIndex: 1,
          }}
        />

        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="открыть меню"
            edge="start"
            onClick={onMenuClick}
            sx={{ 
              mr: 2, 
              color: theme.palette.text.primary,
              p: 1.5,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer',
            mr: 3,
            '&:hover': {
              transform: 'scale(1.02)',
            },
            transition: 'transform 0.2s ease',
          }}
          onClick={() => navigate('/')}
        >
          <Logo 
            variant="full" 
            size={isMobile ? "small" : "medium"}
            color="primary"
            darkMode={theme.palette.mode === 'dark'}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
        }}>
          {/* Notifications - только для десктопа */}
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label="уведомления"
              sx={{ 
                color: theme.palette.text.secondary,
                p: 1.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Notifications />
            </IconButton>
          )}

          {/* Settings - только для десктопа */}
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label="настройки"
              onClick={() => navigate('/settings')}
              sx={{ 
                color: theme.palette.text.secondary,
                p: 1.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <Settings />
            </IconButton>
          )}

          {/* Theme Toggle */}
          <IconButton
            onClick={toggleTheme}
            color="inherit"
            aria-label="переключить тему"
            sx={{ 
              color: theme.palette.text.primary,
              p: 1.5,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            {theme.palette.mode === 'dark' ? (
              <Brightness7 sx={{ color: '#fbbf24' }} />
            ) : (
              <Brightness4 sx={{ color: '#6366f1' }} />
            )}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;