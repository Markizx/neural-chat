import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { syncLanguageWithUserSettings } from '../i18n';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  const { user } = useAuth();

  // Sync language with user settings
  useEffect(() => {
    if (user?.settings?.language) {
      syncLanguageWithUserSettings(user.settings.language);
    }
  }, [user?.settings?.language]);

  return { t, i18n };
}; 