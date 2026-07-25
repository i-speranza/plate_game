import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '@plate-game/shared';
import en from './locales/en.json';
import it from './locales/it.json';

export const UI_LANGUAGE_KEY = 'plateGameUiLanguage';

export function getStoredUiLanguage(): Language {
  const stored = localStorage.getItem(UI_LANGUAGE_KEY);
  if (stored === 'it' || stored === 'en') return stored;
  return 'it';
}

export function setUiLanguage(language: Language): void {
  localStorage.setItem(UI_LANGUAGE_KEY, language);
  void i18n.changeLanguage(language);
  document.documentElement.lang = language;
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
  },
  lng: getStoredUiLanguage(),
  fallbackLng: 'it',
  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = i18n.language;

export default i18n;
