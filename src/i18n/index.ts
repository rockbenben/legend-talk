import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import zh from './zh.json';

// Only en + zh are bundled. Other languages are lazy-loaded on demand.
const LAZY_LANGS = ['zh-Hant','ja','ko','es','pt','fr','de','it','ru','ar','tr','hi','id','vi','th','bn'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh', ...LAZY_LANGS],
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

// Lazy-load a language JSON via dynamic import (Vite auto code-splits)
const loaders: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  'zh-Hant': () => import('./zh-Hant.json'),
  ja: () => import('./ja.json'),
  ko: () => import('./ko.json'),
  es: () => import('./es.json'),
  pt: () => import('./pt.json'),
  fr: () => import('./fr.json'),
  de: () => import('./de.json'),
  it: () => import('./it.json'),
  ru: () => import('./ru.json'),
  ar: () => import('./ar.json'),
  tr: () => import('./tr.json'),
  hi: () => import('./hi.json'),
  id: () => import('./id.json'),
  vi: () => import('./vi.json'),
  th: () => import('./th.json'),
  bn: () => import('./bn.json'),
};

/** Load a lazy language if not yet loaded. Returns immediately if already available. */
export async function ensureLanguageLoaded(lng: string): Promise<void> {
  if (i18n.hasResourceBundle(lng, 'translation')) return;
  const loader = loaders[lng];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(lng, 'translation', mod.default, true, true);
}

// Auto-load detected language at startup (if not en/zh)
const detected = i18n.language;
if (detected && !i18n.hasResourceBundle(detected, 'translation')) {
  ensureLanguageLoaded(detected);
}

export default i18n;
