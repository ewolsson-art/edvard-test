import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import sv from './locales/sv.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      sv: { translation: sv },
      en: { translation: en },
    },
    lng: 'sv',
    fallbackLng: 'sv',
    supportedLngs: ['sv', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      // Default to Swedish unless the user has explicitly chosen another
      // language via the in-app language switcher (which writes to localStorage).
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
