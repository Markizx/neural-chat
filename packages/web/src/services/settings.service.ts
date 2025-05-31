import { apiService } from './api.service';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  defaultModel: {
    claude: string;
    grok: string;
  };
  systemPrompts: {
    claude: string;
    grok: string;
  };
  aiRoles: {
    claude: string;
    grok: string;
  };
  brainstormPrompts: {
    claude: string;
    grok: string;
  };
}

interface UpdateSettingsPayload {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  defaultModel?: {
    claude?: string;
    grok?: string;
  };
  systemPrompts?: {
    claude?: string;
    grok?: string;
  };
  aiRoles?: {
    claude?: string;
    grok?: string;
  };
  brainstormPrompts?: {
    claude?: string;
    grok?: string;
  };
}

class SettingsService {
  async getUserSettings(): Promise<UserSettings> {
    const response = await apiService.get<UserSettings>('/users/settings');
    return response.data || {} as UserSettings;
  }

  async updateSettings(settings: UpdateSettingsPayload): Promise<UserSettings> {
    const response = await apiService.put<UserSettings>('/users/settings', settings);
    return response.data || {} as UserSettings;
  }

  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<UserSettings> {
    return this.updateSettings({ theme });
  }

  async updateLanguage(language: string): Promise<UserSettings> {
    return this.updateSettings({ language });
  }

  async updateNotifications(notifications: { email?: boolean; push?: boolean }): Promise<UserSettings> {
    return this.updateSettings({ notifications });
  }

  async updateDefaultModels(models: { claude?: string; grok?: string }): Promise<UserSettings> {
    return this.updateSettings({ defaultModel: models });
  }

  async updateSystemPrompts(prompts: {
    systemPrompts?: { claude?: string; grok?: string };
    aiRoles?: { claude?: string; grok?: string };
    brainstormPrompts?: { claude?: string; grok?: string };
  }): Promise<UserSettings> {
    return this.updateSettings(prompts);
  }

  // Локальное хранение для быстрого доступа
  private SETTINGS_KEY = 'neural_chat_settings';

  getCachedSettings(): Partial<UserSettings> | null {
    try {
      const cached = localStorage.getItem(this.SETTINGS_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  setCachedSettings(settings: Partial<UserSettings>): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to cache settings:', error);
    }
  }

  clearCachedSettings(): void {
    try {
      localStorage.removeItem(this.SETTINGS_KEY);
    } catch (error) {
      console.error('Failed to clear cached settings:', error);
    }
  }
}

export const settingsService = new SettingsService(); 