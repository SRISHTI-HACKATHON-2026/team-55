import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../public/locales/en/common.json';
import hiTranslation from '../public/locales/hi/common.json';
import knTranslation from '../public/locales/kn/common.json';
import mrTranslation from '../public/locales/mr/common.json';

const resources = {
  en: { common: enTranslation },
  hi: { common: hiTranslation },
  kn: { common: knTranslation },
  mr: { common: mrTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
