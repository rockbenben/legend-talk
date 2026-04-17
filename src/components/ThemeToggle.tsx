import { useSettingsStore } from '../stores/settings';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={t('nav.toggleTheme')}
      title={t('nav.toggleTheme')}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
