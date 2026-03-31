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
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const name = character.name[lang] || character.name.en;
  const era = character.era[lang] || character.era.en;

  return (
    <div
      className={`group p-4 rounded-xl border transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <Avatar emoji={character.avatar} color={character.color} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{era}</div>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(character.id);
            }}
            className={`text-lg hover:scale-110 transition-all ${isFavorite ? '' : 'opacity-0 group-hover:opacity-100'}`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
          className="flex-1 py-1.5 text-sm rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90"
        >
          {t('home.startChat')}
        </button>
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(character);
            }}
            className={`w-9 py-1.5 text-sm rounded-lg border transition-colors ${
              selected
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-400 hover:text-blue-500'
            }`}
          >
            {selected ? '✓' : '+'}
          </button>
        )}
      </div>
    </div>
  );
}
