import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settings';
import { ensureLanguageLoaded } from '../i18n';

const LANG_DISPLAY: Record<string, string> = {
  en: 'English', zh: '中文', 'zh-Hant': '繁體中文', ja: '日本語', ko: '한국어',
  es: 'Español', pt: 'Português', fr: 'Français', de: 'Deutsch', it: 'Italiano',
  ru: 'Русский', ar: 'العربية', tr: 'Türkçe', hi: 'हिन्दी', id: 'Indonesia',
  vi: 'Tiếng Việt', th: 'ไทย', bn: 'বাংলা',
};

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang: currentLangParam } = useParams<{ lang?: string }>();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const languages = (i18n.options.supportedLngs || Object.keys(i18n.store.data)).filter((l) => l !== 'cimode') as string[];

  const handleSelect = async (lng: string) => {
    await ensureLanguageLoaded(lng);
    i18n.changeLanguage(lng);
    setLanguage(lng);
    setOpen(false);

    // Update URL: strip existing lang prefix, add new one
    let path = location.pathname;
    if (currentLangParam && path.startsWith(`/${currentLangParam}`)) {
      path = path.slice(currentLangParam.length + 1);
    }
    navigate(`/${lng}${path || '/chat'}${location.search}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
        aria-label={i18n.t('nav.selectLanguage')}
        title={i18n.t('nav.selectLanguage')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="hidden sm:inline">{LANG_DISPLAY[i18n.language] || i18n.language}</span>
      </button>
      {open && (
        <div className="absolute end-0 mt-1 py-1 min-w-[120px] max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
          {languages.map((lng) => (
            <button
              key={lng}
              onClick={() => handleSelect(lng)}
              className={`block w-full text-start px-3 py-2.5 sm:py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 ${
                i18n.language === lng ? 'text-blue-500 font-medium' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {LANG_DISPLAY[lng] || lng}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
