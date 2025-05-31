import { apiService } from './api.service';
import {
  BrainstormSession,
  StartBrainstormRequest,
  BrainstormMessage,
  BrainstormSummaryResponse,
} from '../types/api.types';

// Re-export for convenience
export type { BrainstormSession };

interface StartBrainstormResponse {
  chat: any; // Chat type
  session: BrainstormSession;
}

interface BrainstormMessageResponse {
  userMessage: BrainstormMessage;
  nextMessages: BrainstormMessage[];
  session: BrainstormSession;
}

export interface BrainstormSessionsResponse {
  sessions: BrainstormSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class BrainstormService {
  // Start new brainstorm session
  async startSession(data: StartBrainstormRequest): Promise<BrainstormSession> {
    const response = await apiService.post<StartBrainstormResponse>(
      '/brainstorm/start',
      data
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to start brainstorm session');
    }
    return (response.data as any).session;
  }

  // Get session by ID
  async getSession(sessionId: string): Promise<BrainstormSession> {
    const response = await apiService.get<StartBrainstormResponse>(`/brainstorm/${sessionId}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get brainstorm session');
    }
    return (response.data as any).session;
  }

  // Send user message to session
  async sendMessage(sessionId: string, content: string): Promise<void> {
    await apiService.post(`/brainstorm/${sessionId}/message`, { content });
  }

  // Pause session
  async pauseSession(sessionId: string): Promise<void> {
    await apiService.post(`/brainstorm/${sessionId}/pause`);
  }

  // Resume session
  async resumeSession(sessionId: string): Promise<void> {
    await apiService.post(`/brainstorm/${sessionId}/resume`);
  }

  // Stop session
  async stopSession(sessionId: string): Promise<void> {
    await apiService.post(`/brainstorm/${sessionId}/stop`);
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
    format: 'json' | 'markdown' = 'json'
  ): Promise<any> {
    const response = await apiService.get<any>(`/brainstorm/${sessionId}/export`, { format });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to export session');
    }
    return response.data;
  }

  // Get all brainstorm sessions
  async getSessions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<BrainstormSessionsResponse> {
    const response = await apiService.get<BrainstormSessionsResponse>('/brainstorm/sessions', params);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to get sessions');
    }
    return response.data;
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    await apiService.delete(`/brainstorm/${sessionId}`);
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