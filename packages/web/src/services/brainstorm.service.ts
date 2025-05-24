import { apiService } from './api.service';
import {
  BrainstormSession,
  StartBrainstormRequest,
  BrainstormMessage,
  BrainstormSummaryResponse,
} from '../types';

interface StartBrainstormResponse {
  chat: any; // Chat type
  session: BrainstormSession;
}

interface BrainstormMessageResponse {
  userMessage: BrainstormMessage;
  nextMessages: BrainstormMessage[];
  session: BrainstormSession;
}

class BrainstormService {
  // Start new brainstorm session
  async startSession(data: StartBrainstormRequest): Promise<StartBrainstormResponse> {
    const response = await apiService.post<StartBrainstormResponse>(
      '/brainstorm/start',
      data
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to start brainstorm session');
    }
    return response.data!;
  }

  // Get session details
  async getSession(sessionId: string): Promise<BrainstormSession> {
    const response = await apiService.get<BrainstormSession>(`/brainstorm/${sessionId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get brainstorm session');
    }
    return response.data!;
  }

  // Send user message to session
  async sendMessage(sessionId: string, content: string): Promise<BrainstormMessageResponse> {
    const response = await apiService.post<BrainstormMessageResponse>(
      `/brainstorm/${sessionId}/message`,
      { content }
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to send message');
    }
    return response.data!;
  }

  // Pause session
  async pauseSession(sessionId: string): Promise<BrainstormSession> {
    const response = await apiService.post<BrainstormSession>(`/brainstorm/${sessionId}/pause`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to pause session');
    }
    return response.data!;
  }

  // Resume session
  async resumeSession(sessionId: string): Promise<BrainstormSession> {
    const response = await apiService.post<BrainstormSession>(`/brainstorm/${sessionId}/resume`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to resume session');
    }
    return response.data!;
  }

  // Stop session
  async stopSession(sessionId: string): Promise<BrainstormSession> {
    const response = await apiService.post<BrainstormSession>(`/brainstorm/${sessionId}/stop`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to stop session');
    }
    return response.data!;
  }

  // Get session summary
  async getSummary(sessionId: string): Promise<BrainstormSummaryResponse> {
    const response = await apiService.get<BrainstormSummaryResponse>(
      `/brainstorm/${sessionId}/summary`
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get summary');
    }
    return response.data!;
  }

  // Export session
  async exportSession(
    sessionId: string,
    format: 'json' | 'markdown' = 'markdown'
  ): Promise<string> {
    const response = await apiService.get<string>(`/brainstorm/${sessionId}/export`, { format });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to export session');
    }
    return response.data!;
  }

  // Get all brainstorm sessions
  async getSessions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ sessions: BrainstormSession[]; pagination: any }> {
    const response = await apiService.get<{ sessions: BrainstormSession[]; pagination: any }>(
      '/brainstorm',
      params
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get sessions');
    }
    return response.data!;
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    const response = await apiService.delete(`/brainstorm/${sessionId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete session');
    }
  }

  // Update session settings
  async updateSettings(sessionId: string, settings: any): Promise<BrainstormSession> {
    const response = await apiService.put<BrainstormSession>(`/brainstorm/${sessionId}/settings`, {
      settings,
    });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update settings');
    }
    return response.data!;
  }

  // Generate insights from session
  async generateInsights(sessionId: string): Promise<string[]> {
    const response = await apiService.post<{ insights: string[] }>(
      `/brainstorm/${sessionId}/insights`
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to generate insights');
    }
    return response.data!.insights;
  }

  // Get session statistics
  async getSessionStats(sessionId: string): Promise<any> {
    const response = await apiService.get(`/brainstorm/${sessionId}/stats`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get session stats');
    }
    return response.data;
  }
}

export const brainstormService = new BrainstormService();