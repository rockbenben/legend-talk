import i18n from '../i18n';

/** Get the current language code from i18n (e.g., 'zh-CN', 'en', 'ja') */
export function currentLang(): string {
  return i18n.language;
}
