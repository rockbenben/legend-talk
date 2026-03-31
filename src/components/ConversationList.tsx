import { currentLang } from '../utils/lang';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';


interface ConversationListProps {
  activeId?: string;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export function ConversationList({ activeId }: ConversationListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const conversations = useConversationStore((s) => s.conversations);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const renameConversation = useConversationStore((s) => s.renameConversation);
  const lang = currentLang();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(isMobile);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const getDisplayTitle = (conv: typeof conversations[0]) => {
    if (conv.title) return conv.title;
    return conv.characters
      .map((id) => {
        const c = presetCharacters.find((p) => p.id === id);
        return c ? (t(`characters.${c.id}.name`)) : id;
      })
      .join(', ');
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => {
      const title = getDisplayTitle(conv).toLowerCase();
      if (title.includes(q)) return true;
      const charNames = conv.characters
        .map((id) => {
          const c = presetCharacters.find((p) => p.id === id);
          return c ? t(`characters.${c.id}.name`).toLowerCase() : id.toLowerCase();
        })
        .join(' ');
      if (charNames.includes(q)) return true;
      return conv.messages.some((m) => m.content.toLowerCase().includes(q));
    });
  }, [conversations, searchQuery, lang]);

  const startEditing = (conv: typeof conversations[0]) => {
    setEditingId(conv.id);
    setEditValue(getDisplayTitle(conv));
  };

  const finishEditing = () => {
    if (editingId && editValue.trim()) {
      renameConversation(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  if (collapsed) {
    return (
      <div className="border-r border-gray-200 dark:border-gray-700 h-full flex flex-col items-center py-2 px-1 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          title={t('nav.settings')}
        >
          ⚙️
        </button>
      </div>
    );
  }

  const sidebarPanel = (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col shrink-0 bg-white dark:bg-gray-900">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          onClick={() => { navigate('/chat'); if (isMobile) setCollapsed(true); }}
          className="flex-1 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          + {t('chat.newChat')}
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>
      </div>
      <div className="px-3 py-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('chat.searchConversations')}
            className="w-full text-sm px-2 py-1.5 pr-7 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs p-1.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 && (
          <p className="p-4 text-sm text-gray-400 text-center">{t('chat.noConversations')}</p>
        )}
        {filteredConversations.map((conv) => {
          return (
            <div
              key={conv.id}
              onClick={() => { navigate(`/chat/${conv.id}`); if (isMobile) setCollapsed(true); }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startEditing(conv);
              }}
              className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 ${
                activeId === conv.id ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditing();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full text-sm px-1 py-0 border border-blue-500 rounded bg-white dark:bg-gray-800 focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="text-sm font-medium truncate">{getDisplayTitle(conv)}</div>
                )}
                <div className="text-xs text-gray-400 truncate">
                  {conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1].content.slice(0, 30)
                    : t('chat.noMessages')}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                  if (activeId === conv.id) navigate('/chat');
                }}
                className="p-1.5 text-gray-400 hover:text-red-500 active:text-red-600 text-xs shrink-0"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => { navigate('/settings'); if (isMobile) setCollapsed(true); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <span>⚙️</span>
          <span>{t('nav.settings')}</span>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setCollapsed(true)} />
        <div className="fixed inset-y-0 left-0 z-50">
          {sidebarPanel}
        </div>
      </>
    );
  }

  return sidebarPanel;
}
