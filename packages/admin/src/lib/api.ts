import axios, { AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';

class AdminApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1/admin',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const session = await getSession();
      if ((session as any)?.accessToken) {
        config.headers.Authorization = `Bearer ${(session as any).accessToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
      { email, password }
    );
    
    // API возвращает структуру: { success: true, data: { user, accessToken, refreshToken } }
    const { user, accessToken } = response.data.data;
    
    return {
      user,
      token: accessToken
    };
  }

  // Dashboard stats
  async getStats() {
    return this.client.get('/analytics/overview');
  }

  async getRevenue(period: string = 'month') {
    return this.client.get('/analytics/revenue', { params: { period } });
  }

  async getUsage(period: string = 'month') {
    return this.client.get('/analytics/usage', { params: { period } });
  }

  // Users
  async getUsers(params?: any) {
    return this.client.get('/users', { params });
  }

  async getUser(id: string) {
    return this.client.get(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.client.put(`/users/${id}`, data);
  }

  async suspendUser(id: string) {
    return this.client.post(`/users/${id}/suspend`);
  }

  async activateUser(id: string) {
    return this.client.post(`/users/${id}/activate`);
  }

  async deleteUser(id: string) {
    return this.client.delete(`/users/${id}`);
  }
  async resetUserPassword(userId: string) {
  return this.client.post(`/users/${userId}/reset-password`);
  }
  async exportUsers() {
    const response = await this.client.get('/users/export', {
      responseType: 'blob',
    });
    return response;
  }

  // Subscriptions
  async getSubscriptions(params?: any) {
    return this.client.get('/subscriptions', { params });
  }

  async updateSubscription(id: string, data: any) {
    return this.client.put(`/subscriptions/${id}`, data);
  }

  async cancelSubscription(id: string) {
    return this.client.post(`/subscriptions/${id}/cancel`);
  }

  // Chats
  async getChats(params?: any) {
    return this.client.get('/chats', { params });
  }

  async getChat(id: string) {
    return this.client.get(`/chats/${id}`);
  }

  async deleteChat(id: string) {
    return this.client.delete(`/chats/${id}`);
  }

  // Content
  async getContent(page: string) {
    return this.client.get(`/content/${page}`);
  }

  async updateContent(page: string, content: string) {
    return this.client.put(`/content/${page}`, { content });
  }

  // System
  async getSystemHealth() {
    return this.client.get('/system/health');
  }

  async getSystemLogs(params?: any) {
    return this.client.get('/system/logs', { params });
  }

  async clearCache() {
    return this.client.post('/system/cache/clear');
  }

  async getConfig() {
    return this.client.get('/system/config');
  }

  async updateConfig(config: any) {
    return this.client.put('/system/config', config);
  }

  // Audit
  async getAuditLogs(params?: any) {
    return this.client.get('/audit/logs', { params });
  }
}

export const adminApi = new AdminApi();