import { useTranslation } from 'react-i18next';
import { presetCharacters } from '../characters/presets';
import { generateCharacter } from '../characters/generator';
import { Avatar } from './Avatar';
import { useState } from 'react';
import { useSettingsStore } from '../stores/settings';
import type { Character } from '../types';

const CATEGORIES = ['all', 'philosophy', 'strategy', 'business', 'psychology', 'science', 'literature', 'art', 'economics', 'politics', 'technology', 'religion', 'education'];

interface CharacterPickerProps {
  onSelect: (character: Character) => void;
  onClose: () => void;
  excludeIds?: string[];
}

export function CharacterPicker({ onSelect, onClose, excludeIds = [] }: CharacterPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const favoriteCharacters = useSettingsStore((s) => s.favoriteCharacters);

  const filtered = presetCharacters.filter((c) => {
    if (excludeIds.includes(c.id)) return false;
    if (category !== 'all' && !c.domain.includes(category)) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = t(`characters.${c.id}.name`).toLowerCase();
      return name.includes(q) || c.id.includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aFav = favoriteCharacters.includes(a.id) ? 0 : 1;
    const bFav = favoriteCharacters.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  const handleSelect = (char: Character) => {
    onSelect(char);
    onClose();
  };

  const handleCustom = () => {
    if (search.trim()) {
      const custom = generateCharacter(search.trim());
      if (!presetCharacters.find((c) => c.id === custom.id)) {
        presetCharacters.push(custom);
      }
      onSelect(custom);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{t('chat.addParticipant')}</h3>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 active:text-gray-800">✕</button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && filtered.length === 0 && handleCustom()}
            placeholder={t('home.search')}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1 text-xs rounded-full ${
                  category === cat
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t(`home.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sorted.map((char) => (
            <div
              key={char.id}
              onClick={() => handleSelect(char)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
            >
              <Avatar emoji={char.avatar} color={char.color} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t(`characters.${char.id}.name`)}</div>
                <div className="text-xs text-gray-400">{t(`characters.${char.id}.era`)}</div>
              </div>
              {favoriteCharacters.includes(char.id) && (
                <span className="text-sm text-yellow-500">{'\u2605'}</span>
              )}
            </div>
          ))}
          {search && filtered.length === 0 && (
            <div className="text-center py-4">
              <button
                onClick={handleCustom}
                className="px-4 py-2 text-sm rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
              >
                {t('home.startChat')} — {search}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
