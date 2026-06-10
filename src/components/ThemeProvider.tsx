import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import type { Locale } from 'antd/es/locale';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settings';

/** Applies the active antd theme tokens to <html> + <body>.
 *  Required because <body> sits OUTSIDE ConfigProvider's CSS scope, so
 *  cssVar-based bg colors never reach it. Must run inside ConfigProvider. */
function ThemeBodyBg() {
  const { token } = theme.useToken();
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    // Use container bg (white in light, near-black in dark) so header /
    // sider / page background read as a single coherent surface.
    body.style.background = token.colorBgContainer;
    body.style.color = token.colorText;
    html.style.background = token.colorBgContainer;
  }, [token.colorBgContainer, token.colorText]);
  return null;
}

/**
 * 「议事录」(Proceedings) theme — paper + ink + a single madder accent.
 * antd components are the interaction/a11y base; the entire visual layer is
 * carried by these seed tokens plus the --lt-* CSS variables in index.css
 * (keep both palettes in sync). Spectral serif is the global body face;
 * Cormorant display serif is applied via `.display-serif`.
 */

const PROCEEDINGS = {
  light: {
    paper: '#F6F4EC', paperDeep: '#EFECDF', elevated: '#FBF9F1',
    ink: '#211F19', inkSoft: '#5C584C', inkFaint: '#8E887A',
    madder: '#8C2F39',
    rule: '#CCC5AE', ruleFaint: '#DFD9C6',
  },
  dark: {
    paper: '#201D17', paperDeep: '#191713', elevated: '#2B271E',
    ink: '#F1EBDC', inkSoft: '#C4BBA6', inkFaint: '#988F79',
    madder: '#CB7B84',
    rule: '#494334', ruleFaint: '#353026',
  },
};

const SERIF_BODY = "'Spectral', 'Noto Serif SC', 'Songti SC', 'SimSun', ui-serif, Georgia, serif";

const LOCALE_LOADERS: Record<string, () => Promise<{ default: Locale }>> = {
  en: () => import('antd/locale/en_US'),
  zh: () => import('antd/locale/zh_CN'),
  'zh-Hant': () => import('antd/locale/zh_TW'),
  ja: () => import('antd/locale/ja_JP'),
  ko: () => import('antd/locale/ko_KR'),
  es: () => import('antd/locale/es_ES'),
  pt: () => import('antd/locale/pt_BR'),
  fr: () => import('antd/locale/fr_FR'),
  de: () => import('antd/locale/de_DE'),
  it: () => import('antd/locale/it_IT'),
  ru: () => import('antd/locale/ru_RU'),
  ar: () => import('antd/locale/ar_EG'),
  tr: () => import('antd/locale/tr_TR'),
  hi: () => import('antd/locale/hi_IN'),
  id: () => import('antd/locale/id_ID'),
  vi: () => import('antd/locale/vi_VN'),
  th: () => import('antd/locale/th_TH'),
  bn: () => import('antd/locale/bn_BD'),
};

interface Props { children: ReactNode }

export function ThemeProvider({ children }: Props) {
  const { i18n } = useTranslation();
  const themeMode = useSettingsStore((s) => s.theme);
  const isDark = themeMode === 'dark';
  const lang = i18n.language;
  const isRtl = lang === 'ar';

  // Keep .dark class on <html> so any legacy CSS hooks still work
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const [locale, setLocale] = useState<Locale | undefined>(undefined);
  useEffect(() => {
    const loader = LOCALE_LOADERS[lang] || LOCALE_LOADERS.en;
    let cancelled = false;
    loader()
      .then((m) => { if (!cancelled) setLocale(m.default); })
      .catch(() => { /* fall back to antd internal default */ });
    return () => { cancelled = true; };
  }, [lang]);

  const config = useMemo(() => {
    const p = isDark ? PROCEEDINGS.dark : PROCEEDINGS.light;
    return {
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      cssVar: { key: 'lt' },
      hashed: false,
      token: {
        colorPrimary: p.madder,
        colorInfo: p.madder,            // focus card & info surfaces stay in-palette
        colorLink: p.madder,
        colorSuccess: '#5F7355',        // muted olive / ochre / brick — print-ink semantics
        colorWarning: '#9A6B2F',
        colorError: '#A1392F',
        colorBgBase: p.paper,
        colorTextBase: p.ink,
        // Explicit secondary/tertiary text — the algorithm's alpha-derived greys
        // sink into the warm dark paper and become unreadable.
        colorTextSecondary: p.inkSoft,
        colorTextTertiary: p.inkFaint,
        colorBgLayout: p.paperDeep,
        colorBgContainer: p.paper,
        colorBgElevated: p.elevated,
        colorBorder: p.rule,
        colorBorderSecondary: p.ruleFaint,
        colorSplit: p.ruleFaint,
        borderRadius: 2,                // print artifacts have corners, not pills
        fontFamily: SERIF_BODY,
        fontSize: 15,
      },
      components: {
        // antd Layout defaults to a dark navy header / sider.
        // Override so they sit on the page background — text stays readable
        // and the editorial chrome doesn't fight the antd defaults.
        Layout: {
          headerBg: 'transparent',
          siderBg: 'transparent',
          bodyBg: 'transparent',
          headerHeight: 56,
          headerPadding: '0 16px',
        },
        // Kill the heavy selected-item bg in dropdowns / language toggle.
        // Selection is communicated by primary text color only — no bg block.
        Menu: {
          itemSelectedBg: 'transparent',
          itemActiveBg: 'transparent',
        },
        Dropdown: {
          controlItemBgActive: 'transparent',
          controlItemBgActiveHover: 'transparent',
        },
        // Flat ink — no tinted button shadows on paper.
        Button: {
          primaryShadow: 'none',
          defaultShadow: 'none',
          dangerShadow: 'none',
        },
      },
    };
  }, [isDark]);

  return (
    <ConfigProvider theme={config} locale={locale} direction={isRtl ? 'rtl' : 'ltr'}>
      <ThemeBodyBg />
      <AntApp style={{ height: '100%' }}>{children}</AntApp>
    </ConfigProvider>
  );
}
