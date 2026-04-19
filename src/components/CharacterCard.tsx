import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  onStartChat: (character: Character) => void;
  onSelect?: (character: Character) => void;
  selected?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (characterId: string) => void;
}

export function CharacterCard({
  character,
  onStartChat,
  onSelect,
  selected,
  isFavorite,
  onToggleFavorite,
}: CharacterCardProps) {
  const { t } = useTranslation();
  const name = t(`characters.${character.id}.name`);
  const era = t(`characters.${character.id}.era`);

  return (
    <div
      className={`group p-3 sm:p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar emoji={character.avatar} color={character.color} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm sm:text-base">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{era}</div>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(character.id);
            }}
            className={`p-1 text-lg hover:scale-110 transition-all ${isFavorite ? '' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}
          >
            {isFavorite ? '\u2605' : '\u2606'}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {character.domain.map((d) => (
          <span
            key={d}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            {t(`home.categories.${d}`, d)}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartChat(character);
          }}
          className="flex-1 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 active:bg-gray-50 dark:active:bg-gray-800"
        >
          {t('home.startChat')}
        </button>
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(character);
            }}
            title={t(selected ? 'roundtable.removeFromRoundtable' : 'roundtable.addToRoundtable')}
            className={`w-11 py-2.5 sm:py-2 rounded-lg border transition-colors flex items-center justify-center ${
              selected
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-blue-50 dark:active:bg-blue-900/20'
            }`}
          >
            {selected ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
