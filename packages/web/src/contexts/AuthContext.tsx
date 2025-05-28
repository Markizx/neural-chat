import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage.service';

interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: {
    plan: 'free' | 'pro' | 'business';
    status: string;
  };
  usage: {
    dailyMessages: number;
    totalMessages: number;
  };
  settings: any;
  security?: {
    twoFactorEnabled?: boolean;
  };
  metadata?: {
    lastLogin?: string;
    referralCode?: string;
  };
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = storageService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.getProfile();
      
      // Обеспечиваем правильную структуру данных пользователя
      const normalizedUser: User = {
        _id: userData._id || userData.id || '',
        email: userData.email || '',
        name: userData.name || '',
        avatar: userData.avatar,
        subscription: {
          plan: userData.subscription?.plan || 'free',
          status: userData.subscription?.status || 'active',
        },
        usage: {
          dailyMessages: userData.usage?.dailyMessages || 0,
          totalMessages: userData.usage?.totalMessages || 0,
        },
        settings: userData.settings || {},
        security: userData.security || {},
        metadata: userData.metadata || {},
        createdAt: userData.createdAt,
      };
      
      setUser(normalizedUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      storageService.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      
      // Нормализуем данные пользователя
      const normalizedUser: User = {
        _id: response.user._id || response.user.id || '',
        email: response.user.email || '',
        name: response.user.name || '',
        avatar: response.user.avatar,
        subscription: {
          plan: response.user.subscription?.plan || 'free',
          status: response.user.subscription?.status || 'active',
        },
        usage: {
          dailyMessages: response.user.usage?.dailyMessages || 0,
          totalMessages: response.user.usage?.totalMessages || 0,
        },
        settings: response.user.settings || {},
        security: response.user.security || {},
        metadata: response.user.metadata || {},
        createdAt: response.user.createdAt,
      };
      
      setUser(normalizedUser);
      storageService.setTokens(response.accessToken, response.refreshToken);
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.register(email, password, name);
      
      // Нормализуем данные пользователя
      const normalizedUser: User = {
        _id: response.user._id || response.user.id || '',
        email: response.user.email || '',
        name: response.user.name || '',
        avatar: response.user.avatar,
        subscription: {
          plan: response.user.subscription?.plan || 'free',
          status: response.user.subscription?.status || 'active',
        },
        usage: {
          dailyMessages: response.user.usage?.dailyMessages || 0,
          totalMessages: response.user.usage?.totalMessages || 0,
        },
        settings: response.user.settings || {},
        security: response.user.security || {},
        metadata: response.user.metadata || {},
        createdAt: response.user.createdAt,
      };
      
      setUser(normalizedUser);
      storageService.setTokens(response.accessToken, response.refreshToken);
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      storageService.clearTokens();
      navigate('/auth/login');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = storageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await authService.refreshToken(refreshToken);
      storageService.setTokens(response.accessToken, response.refreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};