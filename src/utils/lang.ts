import i18n from '../i18n';

/** Get the current language code from i18n (e.g., 'zh-CN', 'en', 'ja') */
export function currentLang(): string {
  return i18n.language;
}

/** antd Dropdown/Drawer placements are physical (no bottomEnd/bottomStart),
 *  so RTL users get menus anchored to the wrong edge unless callers flip
 *  left/right themselves. */
const RTL_LANGS = new Set(['ar']);

export function isRtlLang(lng: string): boolean {
  return RTL_LANGS.has(lng);
}
