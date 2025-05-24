import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import { useTheme } from './contexts/ThemeContext';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/Layout/MainLayout';

// Pages
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import BrainstormPage from './pages/BrainstormPage';
import ProjectsPage from './pages/ProjectsPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AuthPage from './pages/AuthPage';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" />;
};

function App() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <Routes>
        {/* Public routes */}
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/shared/:shareId" element={<div>Shared Chat View</div>} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="chat/:type" element={<ChatPage />} />
          <Route path="chat/:type/:id" element={<ChatPage />} />
          <Route path="brainstorm" element={<BrainstormPage />} />
          <Route path="brainstorm/:id" element={<BrainstormPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="subscription" element={<SubscriptionPage />} />
        </Route>

        {/* Catch all */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;