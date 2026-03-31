import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConversationList } from '../components/ConversationList';
import { ChatView } from '../components/ChatView';
import { CharacterGrid } from '../components/CharacterGrid';
import { Avatar } from '../components/Avatar';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { generateCharacter } from '../characters/generator';
import { roundtableTemplates } from '../characters/templates';
import type { Character } from '../types';

const MAX_PARTICIPANTS = 10;

export function ChatPage() {
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createConversation = useConversationStore((s) => s.createConversation);
  const [searchParams] = useSearchParams();

  const charsParam = searchParams.get('chars');
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (id) return;
    if (!charsParam && !categoryParam) return;

    let charIds: string[] = [];

    if (charsParam) {
      const names = charsParam.split(',').map((s) => s.trim()).filter(Boolean);
      for (const name of names) {
        if (charIds.length >= MAX_PARTICIPANTS) break;
        const lower = name.toLowerCase();
        const found = presetCharacters.find(
          (p) => p.id === lower || t(`characters.${p.id}.name`).toLowerCase() === lower || t(`characters.${p.id}.name`) === name,
        );
        if (found) {
          if (!charIds.includes(found.id)) charIds.push(found.id);
        } else {
          const custom = generateCharacter(name);
          if (!presetCharacters.find((c) => c.id === custom.id)) presetCharacters.push(custom);
          if (!charIds.includes(custom.id)) charIds.push(custom.id);
        }
      }
    } else if (categoryParam) {
      charIds = presetCharacters
        .filter((c) => c.domain.includes(categoryParam))
        .map((c) => c.id)
        .slice(0, MAX_PARTICIPANTS);
    }

    if (charIds.length === 0) return;

    const type = charIds.length === 1 ? 'single' : 'roundtable';
    const convId = createConversation(type, charIds);
    navigate(`/chat/${convId}`, { replace: true });
  }, [id, charsParam, categoryParam, createConversation, navigate]);

  const conversation = useConversationStore((s) =>
    id ? s.conversations.find((c) => c.id === id) : undefined,
  );

  const validId = id && conversation ? id : undefined;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleStartChat = (character: Character) => {
    const exists = presetCharacters.find((c) => c.id === character.id);
    if (!exists) presetCharacters.push(character);
    const convId = createConversation('single', [character.id]);
    navigate(`/chat/${convId}`);
  };

  const handleSelect = (character: Character) => {
    setSelectedIds((prev) =>
      prev.includes(character.id)
        ? prev.filter((cid) => cid !== character.id)
        : prev.length < MAX_PARTICIPANTS
          ? [...prev, character.id]
          : prev,
    );
  };

  const startRoundtable = () => {
    if (selectedIds.length >= 2) {
      const convId = createConversation('roundtable', selectedIds);
      setSelectedIds([]);
      navigate(`/chat/${convId}`);
    }
  };

  return (
    <div className="flex h-full">
      <ConversationList activeId={validId} />
      <div className="flex-1">
        {validId ? (
          <ChatView conversationId={validId} />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">{t('home.title')}</h2>
                <button
                  onClick={() => {
                    const shuffled = [...presetCharacters].sort(() => Math.random() - 0.5);
                    const charIds = shuffled.slice(0, 5).map((c) => c.id);
                    const convId = createConversation('roundtable', charIds);
                    navigate(`/chat/${convId}`);
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
                >
                  🎲 {t('home.randomRoundtable')}
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('home.subtitle')}</p>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('home.templates')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {roundtableTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        const convId = createConversation('roundtable', tpl.characters);
                        navigate(`/chat/${convId}`);
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors text-left"
                    >
                      <div className="flex -space-x-1 shrink-0">
                        {tpl.characters.slice(0, 3).map((cid) => {
                          const char = presetCharacters.find((c) => c.id === cid);
                          return char ? <Avatar key={cid} emoji={char.avatar} color={char.color} size="sm" /> : null;
                        })}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{t(`templates.${tpl.id}.name`)}</div>
                        <div className="text-xs text-gray-400 truncate">{t(`templates.${tpl.id}.description`)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <CharacterGrid
                onStartChat={handleStartChat}
                onSelect={handleSelect}
                selectedIds={selectedIds}
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1 overflow-x-auto shrink min-w-0">
                    {selectedIds.map((cid) => {
                      const char = presetCharacters.find((c) => c.id === cid);
                      if (!char) return null;
                      return (
                        <button
                          key={cid}
                          onClick={() => setSelectedIds((prev) => prev.filter((x) => x !== cid))}
                          title={t(`characters.${char.id}.name`)}
                          className="shrink-0 hover:opacity-70 active:opacity-50 transition-opacity"
                        >
                          <Avatar emoji={char.avatar} color={char.color} size="sm" />
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-sm text-gray-500 shrink-0">{t('roundtable.selected', { count: selectedIds.length })}</span>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button
                      onClick={startRoundtable}
                      disabled={selectedIds.length < 2}
                      className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white disabled:opacity-50 active:bg-blue-600"
                    >
                      {t('roundtable.start')}
                    </button>
                    {selectedIds.length >= 2 && (
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}#/chat?chars=${selectedIds.join(',')}`;
                          navigator.clipboard.writeText(url);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        className="hidden sm:block px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
                      >
                        {linkCopied ? t('chat.linkCopied') : t('chat.copyLineupLink')}
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedIds([])}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:text-gray-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
