import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { syncLanguageWithUserSettings, supportedLanguages } from '../i18n';
import { storageService } from '../services/storage.service';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  const { user } = useAuth();

  // Sync language with user settings
  useEffect(() => {
    if (user?.settings?.language) {
      syncLanguageWithUserSettings(user.settings);
    } else {
      // Fallback to localStorage or browser default
      const savedLanguage = storageService.getLanguage();
      if (savedLanguage && Object.keys(supportedLanguages).includes(savedLanguage)) {
        i18n.changeLanguage(savedLanguage);
      } else {
        // Use browser language or fallback to Russian
        const browserLang = navigator.language.split('-')[0];
        const defaultLang = Object.keys(supportedLanguages).includes(browserLang) ? browserLang : 'ru';
        i18n.changeLanguage(defaultLang);
        storageService.setLanguage(defaultLang);
      }
    }
  }, [user?.settings?.language, user?.settings, i18n]);

  return { t, i18n };
}; 