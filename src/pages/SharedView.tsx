import { useLangPath } from "../hooks/useLangPath";
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageBubble } from '../components/MessageBubble';
import { presetCharacters } from '../characters/presets';
import { decompressFromBase64 } from '../utils/compress';
import { useSettingsStore } from '../stores/settings';

interface SharedMessage {
  role: 'user' | 'character';
  characterId?: string;
  content: string;
}

interface SharedData {
  title?: string;
  characters: string[];
  messages: SharedMessage[];
}

export function SharedView() {
  const { data } = useParams<{ data: string }>();
  const { t } = useTranslation();
  const lp = useLangPath();
  const [shared, setShared] = useState<SharedData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!data) return;

    // s:<proxyBase64>:<id> → fetch from the sharer's proxy
    if (data.startsWith('s:')) {
      const parts = data.slice(2).split(':');
      let proxy = useSettingsStore.getState().corsProxy;
      try { if (parts.length >= 2) proxy = atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')); } catch { /* use default */ }
      const id = parts.length >= 2 ? parts[1] : parts[0];
      fetch(`${proxy}/s/${id}`)
        .then((res) => { if (!res.ok) throw new Error('Not found'); return res.text(); })
        .then((base64) => decompressFromBase64(base64))
        .then((json) => setShared(JSON.parse(json)))
        .catch(() => setError(t('common.error', { message: '' })));
      return;
    }

    // Inline compressed data
    decompressFromBase64(data)
      .then((json) => setShared(JSON.parse(json)))
      .catch(() => setError(t('common.error', { message: '' })));
  }, [data]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-red-500">{error}</p>
        <Link
          to={lp("/chat")}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
        >
          {t('shared.startOwn')}
        </Link>
      </div>
    );
  }

  if (!shared) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  const characters = shared.characters
    .map((id) => presetCharacters.find((c) => c.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof presetCharacters.find>>[];

  const isMulti = characters.length > 1;

  const displayTitle = shared.title
    || characters.map((c) => t(`characters.${c.id}.name`)).join(', ')
    || t('shared.title');

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold">{displayTitle}</h2>
        <p className="text-xs text-gray-400">{t('shared.title')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4">
        {shared.messages.map((msg, idx) => {
          const msgChar = msg.characterId
            ? presetCharacters.find((c) => c.id === msg.characterId)
            : undefined;
          return (
            <MessageBubble
              key={idx}
              content={msg.content}
              isUser={msg.role === 'user'}
              avatar={msgChar?.avatar}
              color={msgChar?.color}
              name={isMulti && msgChar ? (t(`characters.${msgChar.id}.name`)) : undefined}
            />
          );
        })}
      </div>

      <div className="flex justify-center px-4 py-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          to={lp("/chat")}
          className="px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 text-sm font-medium"
        >
          {t('shared.startOwn')}
        </Link>
      </div>
    </div>
  );
}
