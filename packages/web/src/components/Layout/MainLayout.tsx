import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNavigation from './MobileBottomNavigation';

const drawerWidth = 280;

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box 
      className="main-layout-container"
      sx={{ 
        display: 'flex', 
        height: '100vh',
        overflow: 'hidden',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)'
          : 'linear-gradient(135deg, #fafafb 0%, #f3f4f6 100%)',
      }}
    >
      {/* Glow Effects */}
      <Box
        sx={{
          position: 'fixed',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.15)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
          top: '-150px',
          right: '-150px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
          bottom: '-200px',
          left: '-200px',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Sidebar для десктопа */}
      {!isMobile && (
        <Box
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            background: theme.palette.mode === 'dark'
              ? 'rgba(15, 15, 20, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.06)'
            }`,
            boxShadow: theme.palette.mode === 'dark'
              ? 'none'
              : '2px 0 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <Sidebar />
        </Box>
      )}

      {/* Sidebar для мобильных */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              background: theme.palette.mode === 'dark'
                ? 'rgba(15, 15, 20, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: 'none',
            },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
      )}

      {/* Основной контент */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header только для мобильных */}
        {isMobile && (
          <Header onMenuClick={handleDrawerToggle} />
        )}

        {/* Контент */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            position: 'relative',
            minHeight: 0, // Важно для правильной работы flex
            mb: isMobile ? '64px' : 0, // Отступ для мобильной навигации
          }}
        >
          <Outlet />
        </Box>

        {/* Мобильная навигация */}
        {isMobile && <MobileBottomNavigation />}
      </Box>
    </Box>
  );
};

export default MainLayout;