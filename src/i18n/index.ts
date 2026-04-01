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

/** Resolve a language code to the closest supported language (e.g., zh-TW → zh-Hant, zh-CN → zh, en-US → en) */
export function resolveSupported(lng: string): string {
  const supported = (i18n.options.supportedLngs || []) as string[];
  if (supported.includes(lng)) return lng;
  // Chinese: Traditional (TW/HK/MO/Hant) → zh-Hant, Simplified (CN/SG/Hans) → zh
  if (lng.startsWith('zh')) {
    return /Hant|TW|HK|MO/i.test(lng) ? 'zh-Hant' : 'zh';
  }
  // Other languages: strip region (en-US → en, pt-BR → pt, ar-SA → ar, etc.)
  const base = lng.split('-')[0];
  return supported.find((s) => s === base) || lng;
}

/** Load a lazy language if not yet loaded. Returns immediately if already available. */
export async function ensureLanguageLoaded(lng: string): Promise<void> {
  const resolved = resolveSupported(lng);
  if (i18n.hasResourceBundle(resolved, 'translation')) return;
  const loader = loaders[resolved];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(resolved, 'translation', mod.default, true, true);
}

// Normalize detected language to closest supported (e.g., zh-CN → zh, en-US → en)
// i18n.resolvedLanguage is the actual language used for resource lookup
const resolved = i18n.resolvedLanguage;
if (resolved && i18n.language !== resolved) {
  i18n.changeLanguage(resolved);
} else if (i18n.language && !i18n.hasResourceBundle(i18n.language, 'translation')) {
  ensureLanguageLoaded(i18n.language);
}

export default i18n;
