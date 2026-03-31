import type { Character } from '../types';
import i18n from '../i18n';

const COLORS = ['blue', 'emerald', 'red', 'purple', 'amber', 'teal', 'orange', 'indigo'];

export function generateCharacter(name: string): Character {
  const trimmed = name.trim();
  const id = 'custom-' + trimmed.toLowerCase().replace(/\s+/g, '-');
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
