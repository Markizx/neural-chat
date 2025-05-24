import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 280;

const MainLayout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Header onMenuClick={handleDrawerToggle} />
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
              },
            }}
          >
            <Sidebar onClose={handleDrawerToggle} />
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                  : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                borderRight: `1px solid ${theme.palette.divider}`,
              },
            }}
            open
          >
            <Sidebar />
          </Drawer>
        )}
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ height: 64 }} /> {/* Header spacer */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;