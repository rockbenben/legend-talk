import i18n from '../i18n';

/** Get the current language code from i18n (e.g., 'zh-CN', 'en', 'ja') */
export function currentLang(): string {
  return i18n.language;
}

/**
 * Look up a localized value from a Record with fallback chain:
 * full code ('zh-CN') → base code ('zh') → 'en'
 */
export function localized<T = string>(record: Record<string, T>, lang?: string): T {
  const l = lang || i18n.language;
  return record[l] || record[l.split('-')[0]] || record.en;
}
