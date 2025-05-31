import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_URL = 'http://localhost:5000/api/v1';

// Debug: Логируем API URL для отладки
console.log('Admin API URL:', API_URL);

// Создаем axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor для добавления токена к каждому запросу
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
      console.log('API Request with token:', { 
        url: config.url,
        hasToken: true,
        tokenPreview: session.accessToken.substring(0, 20) + '...'
      });
    } else {
      console.log('API Request without token:', { url: config.url });
    }
  }
  return config;
});

class AdminApi {
  async login(email: string, password: string) {
    try {
      console.log('Admin login attempt:', { email, url: `${API_URL}/auth/login` });
      const response = await api.post('/auth/login', { email, password });
      console.log('Admin login response:', response.data);
      
      // Проверяем успешность ответа
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Login failed');
      }
      
      // Проверяем, что пользователь имеет роль admin
      const user = response.data.data?.user || response.data.user;
      if (!user || user.role !== 'admin') {
        throw new Error('Access denied: Admin role required');
      }
      
      // Токен будет сохранен в NextAuth сессии, не нужно сохранять в localStorage
      return response.data;
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  // Dashboard Stats
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  }

  // Users Management
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  }

  async getUserActivity(userId: string) {
    const response = await api.get(`/admin/users/${userId}/activity`);
    return response.data;
  }

  async updateUser(userId: string, data: any) {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async exportUsers() {
    const response = await api.get('/admin/users/export', {
      responseType: 'blob',
    });
    return response;
  }

  async createUser(data: any) {
    const response = await api.post('/admin/users', data);
    return response.data;
  }

  // Chats Management
  async getChats(params?: { page?: number; limit?: number; type?: string }) {
    const response = await api.get('/admin/chats', { params });
    return response.data;
  }

  async getChatById(chatId: string) {
    const response = await api.get(`/admin/chats/${chatId}`);
    return response.data;
  }

  async deleteChat(chatId: string) {
    const response = await api.delete(`/admin/chats/${chatId}`);
    return response.data;
  }

  // Analytics
  async getAnalytics(timeframe: string = '7d') {
    const response = await api.get('/admin/analytics', {
      params: { timeframe },
    });
    return response.data;
  }

  async getRevenue(period: string = 'month') {
    const response = await api.get('/admin/analytics/revenue', {
      params: { period },
    });
    return response.data;
  }

  async getUsage(type: string = 'distribution') {
    const response = await api.get('/admin/analytics/usage', {
      params: { type },
    });
    return response.data;
  }

  async getUsageStats(params?: { startDate?: string; endDate?: string }) {
    const response = await api.get('/admin/analytics/usage', { params });
    return response.data;
  }

  // Subscriptions Management
  async getSubscriptions(params?: { page?: number; limit?: number; status?: string }) {
    const response = await api.get('/admin/subscriptions', { params });
    return response.data;
  }

  async getSubscriptionStats() {
    const response = await api.get('/admin/subscriptions/stats');
    return response.data;
  }

  async updateSubscription(subscriptionId: string, data: any) {
    const response = await api.put(`/admin/subscriptions/${subscriptionId}`, data);
    return response.data;
  }

  async cancelSubscription(subscriptionId: string) {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/cancel`);
    return response.data;
  }

  // System Settings
  async getSettings() {
    const response = await api.get('/admin/settings');
    return response.data;
  }

  async updateSettings(settings: any) {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  }

  // API Keys Management
  async getApiKeys() {
    const response = await api.get('/admin/api-keys');
    return response.data;
  }

  async updateApiKey(service: string, apiKey: string) {
    const response = await api.put(`/admin/api-keys/${service}`, { apiKey });
    return response.data;
  }

  // Logs and Monitoring
  async getLogs(params?: { level?: string; limit?: number }) {
    const response = await api.get('/admin/logs', { params });
    return response.data;
  }

  async getAuditLogs(params?: { limit?: number }) {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  }

  async getSystemHealth() {
    const response = await api.get('/admin/health');
    return response.data;
  }

  // User Actions
  async suspendUser(userId: string) {
    const response = await api.post(`/admin/users/${userId}/suspend`);
    return response.data;
  }

  async activateUser(userId: string) {
    const response = await api.post(`/admin/users/${userId}/activate`);
    return response.data;
  }

  async resetUserPassword(userId: string) {
    const response = await api.post(`/admin/users/${userId}/reset-password`);
    return response.data;
  }

  // Plans Management
  async getPlans() {
    const response = await api.get('/admin/plans');
    return response.data;
  }

  async createPlan(data: any) {
    const response = await api.post('/admin/plans', data);
    return response.data;
  }

  async updatePlan(planId: string, data: any) {
    const response = await api.put(`/admin/plans/${planId}`, data);
    return response.data;
  }

  async deletePlan(planId: string) {
    const response = await api.delete(`/admin/plans/${planId}`);
    return response.data;
  }

  // Subscription Actions
  async changeUserPlan(userId: string, planId: string) {
    const response = await api.post(`/admin/users/${userId}/change-plan`, { planId });
    return response.data;
  }

  async extendSubscription(subscriptionId: string, days: number) {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/extend`, { days });
    return response.data;
  }

  async refundSubscription(subscriptionId: string, amount?: number) {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/refund`, { amount });
    return response.data;
  }
}

export const adminApi = new AdminApi();