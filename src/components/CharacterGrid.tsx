import { useLangPath } from "../hooks/useLangPath";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CharacterCard } from './CharacterCard';
import { CharacterEditor } from './CharacterEditor';
import { presetCharacters } from '../characters/presets';
import { generateCharacter } from '../characters/generator';
import { useSettingsStore } from '../stores/settings';
import type { Character } from '../types';

interface CharacterGridProps {
  onStartChat: (character: Character) => void;
  onSelect?: (character: Character) => void;
  selectedIds?: string[];
}

const CATEGORIES = ['all', 'philosophy', 'strategy', 'business', 'finance', 'history', 'sociology', 'psychology', 'science', 'literature', 'art', 'economics', 'politics', 'technology', 'religion', 'education'];

export function CharacterGrid({ onStartChat, onSelect, selectedIds = [] }: CharacterGridProps) {
  const { t } = useTranslation();
  const lp = useLangPath();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const favoriteCharacters = useSettingsStore((s) => s.favoriteCharacters);
  const toggleFavorite = useSettingsStore((s) => s.toggleFavorite);

  const filtered = presetCharacters.filter((c) => {
    if (category !== 'all' && !c.domain.includes(category)) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = t(`characters.${c.id}.name`).toLowerCase();
      return name.includes(q) || c.id.includes(q);
    }
    return true;
  });

  // Sort: favorites first, then custom characters, then presets
  const sorted = [...filtered].sort((a, b) => {
    const aFav = favoriteCharacters.includes(a.id) ? 0 : 1;
    const bFav = favoriteCharacters.includes(b.id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    const aCustom = a.domain.includes('custom') ? 0 : 1;
    const bCustom = b.domain.includes('custom') ? 0 : 1;
    return aCustom - bCustom;
  });

  const handleSearchSubmit = () => {
    if (search && filtered.length === 0) {
      const custom = generateCharacter(search);
      onStartChat(custom);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
          placeholder={t('home.search')}
          className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setLinkCopied(false); }}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-full ${
              category === cat
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t(`home.categories.${cat}`)}
          </button>
        ))}
        {category !== 'all' && (
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#${lp('/chat')}?category=${category}`;
              navigator.clipboard.writeText(url).catch(() => {});
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className="p-1.5 rounded-full text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            title={t('chat.copyCategoryLink')}
          >
            {linkCopied ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-blue-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </button>
        )}
      </div>
      <div className="mb-4">
        <button onClick={() => setShowEditor(true)}
          className="px-3 py-2 sm:py-1.5 text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:border-blue-400 active:text-blue-500 transition-colors">
          + {t('chat.createCharacter')}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {sorted.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            onStartChat={onStartChat}
            onSelect={onSelect}
            selected={selectedIds.includes(c.id)}
            isFavorite={favoriteCharacters.includes(c.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
      {search && filtered.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">{t('home.search')}</p>
          <button
            onClick={handleSearchSubmit}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
          >
            {t('home.startChat')} — {search}
          </button>
        </div>
      )}
      {showEditor && (
        <CharacterEditor
          onClose={() => setShowEditor(false)}
          onStartChat={(id) => {
            const char = presetCharacters.find((c) => c.id === id);
            if (char) onStartChat(char);
          }}
        />
      )}
    </div>
  );
}
