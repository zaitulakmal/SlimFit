import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import ms from './locales/ms.json';

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLng = deviceLocale === 'ms' ? 'ms' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ms: { translation: ms },
  },
  lng: supportedLng,
  fallbackLng: 'en',
  interpolation: {
    // React already handles XSS; disable escaping to render values as-is
    escapeValue: false,
  },
});

export default i18n;
