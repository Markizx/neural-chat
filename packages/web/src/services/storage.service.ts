class StorageService {
  private readonly ACCESS_TOKEN_KEY = 'smartchat_access_token';
  private readonly REFRESH_TOKEN_KEY = 'smartchat_refresh_token';
  private readonly THEME_KEY = 'smartchat_theme';
  private readonly LANGUAGE_KEY = 'smartchat_language';

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Theme management
  getTheme(): string | null {
    return localStorage.getItem(this.THEME_KEY);
  }

  setTheme(theme: string): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  // Language management
  getLanguage(): string | null {
    return localStorage.getItem(this.LANGUAGE_KEY);
  }

  setLanguage(language: string): void {
    localStorage.setItem(this.LANGUAGE_KEY, language);
  }

  // Generic storage methods
  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  set(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }

  // JSON storage helpers
  getJSON<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    try {
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  }

  setJSON(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export const storageService = new StorageService();