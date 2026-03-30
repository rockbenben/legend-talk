import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

interface NavLink {
  label: string;
  zh: string;
  en: string;
}

const PROJECT_LINKS: NavLink[] = [
  { label: 'AI Short', zh: 'https://www.aishort.top/', en: 'https://www.aishort.top/en/' },
  { label: 'ToolsByAI', zh: 'https://tools.newzone.top/zh', en: 'https://tools.newzone.top/en' },
  { label: 'IMGPrompt', zh: 'https://prompt.newzone.top/app/zh', en: 'https://prompt.newzone.top/app/en' },
];

const SUPPORT_LINKS: NavLink[] = [
  { label: 'Discord', zh: 'https://discord.gg/PZTQfJ4GjX', en: 'https://discord.gg/PZTQfJ4GjX' },
  { label: 'Telegram', zh: 'https://t.me/aishort_top', en: 'https://t.me/aishort_top' },
  { label: 'QQ', zh: 'https://qm.qq.com/q/uWsUSnyivm', en: '' },
];

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
          {children}
        </div>
      )}
    </div>
  );
}

function NavLinks({ links, lang }: { links: NavLink[]; lang: 'zh' | 'en' }) {
  return (
    <>
      {links.map((link) => {
        const href = lang === 'zh' ? link.zh : link.en;
        if (!href) return null;
        return (
          <a
            key={link.label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {link.label}
          </a>
        );
      })}
    </>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = (i18n.language.startsWith('zh') ? 'zh' : 'en') as 'zh' | 'en';

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1
          className="text-lg font-bold cursor-pointer hover:opacity-80"
          onClick={() => navigate('/chat')}
        >
          Legend Talk
        </h1>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <Dropdown label={lang === 'zh' ? '更多' : 'More'}>
            <NavLinks links={PROJECT_LINKS} lang={lang} />
          </Dropdown>
          <Dropdown label={lang === 'zh' ? '支持' : 'Support'}>
            <NavLinks links={SUPPORT_LINKS} lang={lang} />
          </Dropdown>
          <a
            href="https://github.com/rockbenben/legend-talk"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
