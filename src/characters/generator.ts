import type { Character } from '../types';
import i18n from '../i18n';

const COLORS = ['blue', 'emerald', 'red', 'purple', 'amber', 'teal', 'orange', 'indigo'];

/**
 * Deterministic id for a custom character, derived from its name. The SAME helper
 * is used everywhere a custom character can be created — deep links (`?chars=`),
 * registry search, and the editor — so a given name always maps to one id and the
 * three paths resolve to the same character instead of three different ones.
 *
 * Normalization: trim → lowercase → collapse any run of non-letter/non-number
 * characters into a single hyphen → strip edge hyphens. Unicode letters/numbers
 * are preserved (so "苏格拉底" → "custom-苏格拉底"); an all-punctuation name falls
 * back to "custom-unnamed".
 */
export function customCharacterId(name: string): string {
  const trimmed = name.trim();
  const slug = trimmed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  // Slug can be empty for symbol/emoji-only names; fall back to a deterministic hash
  // so two different such names don't collide onto one id.
  return 'custom-' + (slug || Math.abs(hashCode(trimmed)).toString(36));
}

export function generateCharacter(name: string): Character {
  const trimmed = name.trim();
  const id = customCharacterId(trimmed);
  const colorIndex = Math.abs(hashCode(trimmed)) % COLORS.length;

  // Inject translations for this custom character into all loaded languages
  for (const lng of Object.keys(i18n.store.data)) {
    const existing = i18n.getResourceBundle(lng, 'translation') || {};
    if (!existing.characters?.[id]) {
      i18n.addResourceBundle(lng, 'translation', {
        characters: { [id]: { name: trimmed, era: i18n.t('common.unknown', { lng }), questions: [] } },
      }, true, true);
    }
  }

  return {
    id,
    domain: ['custom'],
    avatar: '👤',
    color: COLORS[colorIndex],
    systemPrompt: `Think and respond as ${trimmed} would. Apply their core ideas and thinking framework to analyze problems. Be direct — no pleasantries, jump straight into your perspective.`,
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
