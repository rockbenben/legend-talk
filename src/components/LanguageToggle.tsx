import { Button, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
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

  const languages = (i18n.options.supportedLngs || Object.keys(i18n.store.data)).filter((l) => l !== 'cimode') as string[];

  const handleSelect = async (lng: string) => {
    await ensureLanguageLoaded(lng);
    i18n.changeLanguage(lng);
    setLanguage(lng);
    let path = location.pathname;
    if (currentLangParam && path.startsWith(`/${currentLangParam}`)) {
      path = path.slice(currentLangParam.length + 1);
    }
    navigate(`/${lng}${path || '/chat'}${location.search}`);
  };

  const items = languages.map((lng) => ({
    key: lng,
    label: LANG_DISPLAY[lng] || lng,
    onClick: () => handleSelect(lng),
  }));

  return (
    <Dropdown
      menu={{ items, selectedKeys: [i18n.language] }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button type="text" icon={<GlobalOutlined />} aria-label={i18n.t('nav.selectLanguage')} title={i18n.t('nav.selectLanguage')}>
        <span className="hidden sm:inline">{LANG_DISPLAY[i18n.language] || i18n.language}</span>
      </Button>
    </Dropdown>
  );
}
