import { useState } from 'react';
import { useLangPath } from '../hooks/useLangPath';
import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import type { Character } from '../types';

interface ParticipantsBarProps {
  characters: Character[];
  conversationCharIds: string[];
  isMulti: boolean;
  isGenerating: boolean;
  currentSpeaker: string | null;
  onAdd: () => void;
  onRemove: (charId: string) => void;
}

export function ParticipantsBar({
  characters, conversationCharIds, isMulti, isGenerating, currentSpeaker, onAdd, onRemove,
}: ParticipantsBarProps) {
  const { t } = useTranslation();
  const lp = useLangPath();
  const [linkCopied, setLinkCopied] = useState(false);

  return (
    <div className="flex items-center gap-1 px-2 sm:px-4 py-1.5 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {characters.map((char) => (
        <div
          key={char.id}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${
            isMulti && currentSpeaker === char.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
          }`}
        >
          <Avatar emoji={char.avatar} color={char.color} size="sm" />
          <span className="text-xs">{t(`characters.${char.id}.name`)}</span>
          {isMulti && !isGenerating && conversationCharIds.length > 2 && (
            <button
              onClick={() => onRemove(char.id)}
              className="text-gray-400 hover:text-red-500 text-xs ms-0.5"
              title={t('roundtable.removeParticipant')}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {!isGenerating && (
        <>
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
          >
            + {t('chat.addParticipant')}
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}#${lp('/chat')}?chars=${conversationCharIds.join(',')}`;
              navigator.clipboard.writeText(url).catch(() => {});
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className="p-1 rounded-full text-gray-400 hover:text-blue-500 transition-colors"
            title={t('chat.copyLineupLink')}
          >
            {linkCopied ? (
              <span className="text-xs text-blue-500">{t('chat.linkCopied')}</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            )}
          </button>
        </>
      )}
    </div>
  );
}
