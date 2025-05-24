import { apiService } from './api.service';

export interface LoginResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse extends LoginResponse {}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/login', {
      email,
      password,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Login failed');
    }

    return response.data!;
  }

  async register(email: string, password: string, name: string): Promise<RegisterResponse> {
    const response = await apiService.post<RegisterResponse>('/auth/register', {
      email,
      password,
      name,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Registration failed');
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    await apiService.post('/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiService.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    if (!response.success) {
      throw new Error(response.error?.message || 'Token refresh failed');
    }

    return response.data!;
  }

  async verifyEmail(token: string): Promise<void> {
    const response = await apiService.get(`/auth/verify-email/${token}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Email verification failed');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await apiService.post('/auth/forgot-password', { email });

    if (!response.success) {
      throw new Error(response.error?.message || 'Password reset request failed');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const response = await apiService.post('/auth/reset-password', {
      token,
      password,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Password reset failed');
    }
  }

  async googleAuth(idToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>('/auth/google', {
      idToken,
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Google authentication failed');
    }

    return response.data!;
  }

  async getProfile(): Promise<any> {
    const response = await apiService.get('/user/profile');

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get profile');
    }

    return response.data;
  }
}

export const authService = new AuthService();