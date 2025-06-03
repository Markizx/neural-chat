import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { storageService } from '../services/storage.service';
import { syncLanguageWithUserSettings } from '../i18n';

interface User {
  _id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: {
    plan: 'free' | 'pro' | 'business';
    status: string;
    provider?: string;
    customerId?: string;
    subscriptionId?: string;
    currentPeriodStart?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd?: boolean;
    trialEnd?: string;
  };
  usage: {
    dailyMessages: number;
    totalMessages: number;
    dailyTokens?: number;
    monthlyTokens?: number;
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
  googleLogin: (idToken: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUserData = (userData: any): User => {
  return {
    _id: userData._id || userData.id || '',
    email: userData.email || '',
    name: userData.name || '',
    avatar: userData.avatar,
    subscription: {
      plan: userData.subscription?.plan || 'free',
      status: userData.subscription?.status || 'active',
      provider: userData.subscription?.provider,
      customerId: userData.subscription?.customerId,
      subscriptionId: userData.subscription?.subscriptionId,
      currentPeriodStart: userData.subscription?.currentPeriodStart,
      currentPeriodEnd: userData.subscription?.currentPeriodEnd,
      cancelAtPeriodEnd: userData.subscription?.cancelAtPeriodEnd,
      trialEnd: userData.subscription?.trialEnd,
    },
    usage: {
      dailyMessages: userData.usage?.dailyMessages || 0,
      totalMessages: userData.usage?.totalMessages || 0,
      dailyTokens: userData.usage?.dailyTokens || 0,
      monthlyTokens: userData.usage?.monthlyTokens || 0,
    },
    settings: userData.settings || {},
    security: userData.security || {},
    metadata: userData.metadata || {},
    createdAt: userData.createdAt,
  };
};

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
      const normalizedUser = normalizeUserData(userData);
      
      setUser(normalizedUser);
      syncLanguageWithUserSettings(normalizedUser.settings);
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
      const normalizedUser = normalizeUserData(response.user);
      
      setUser(normalizedUser);
      storageService.setTokens(response.accessToken, response.refreshToken);
      syncLanguageWithUserSettings(normalizedUser.settings);
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = async (idToken: string) => {
    try {
      const response = await authService.googleLogin(idToken);
      const normalizedUser = normalizeUserData(response.user);
      
      setUser(normalizedUser);
      storageService.setTokens(response.accessToken, response.refreshToken);
      syncLanguageWithUserSettings(normalizedUser.settings);
      navigate('/');
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.register(email, password, name);
      const normalizedUser = normalizeUserData(response.user);
      
      setUser(normalizedUser);
      storageService.setTokens(response.accessToken, response.refreshToken);
      syncLanguageWithUserSettings(normalizedUser.settings);
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
    googleLogin,
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