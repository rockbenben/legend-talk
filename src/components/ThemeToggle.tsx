import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settings';

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <Button
      type="text"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
      aria-label={t('nav.toggleTheme')}
      title={t('nav.toggleTheme')}
    />
  );
}
