import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { storageService } from '../services/storage.service';

// Supported languages
export const supportedLanguages = {
  en: { name: 'English', flag: '🇬🇧' },
  ru: { name: 'Русский', flag: '🇷🇺' },
  es: { name: 'Español', flag: '🇪🇸' },
  fr: { name: 'Français', flag: '🇫🇷' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  zh: { name: '中文', flag: '🇨🇳' },
  ja: { name: '日本語', flag: '🇯🇵' },
};

i18n
  // Load translation using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Have a common namespace used around the full app
    ns: ['translation'],
    defaultNS: 'translation',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Language detection options
    detection: {
      // Order and from where user language should be detected
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys or params to lookup language from
      lookupLocalStorage: 'neuralchat_language',
      
      // Cache user language on
      caches: ['localStorage'],
    },

    // Backend options
    backend: {
      // Path where resources get loaded from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    react: {
      // Wait for all translations to be loaded before rendering
      useSuspense: true,
    },
  });

// Custom hook to sync i18n with user settings
export const syncLanguageWithUserSettings = (settings: any) => {
  const language = settings?.language;
  if (language && language !== i18n.language && Object.keys(supportedLanguages).includes(language)) {
    i18n.changeLanguage(language);
    storageService.setLanguage(language);
  }
};

// Force set language immediately
export const forceSetLanguage = (language: string) => {
  if (Object.keys(supportedLanguages).includes(language)) {
    i18n.changeLanguage(language);
    storageService.setLanguage(language);
  }
};

export default i18n; 