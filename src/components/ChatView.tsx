import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../stores/conversations';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useRoundtable } from '../hooks/useRoundtable';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { getLangInstruction, resolveProvider, streamResponse } from '../utils/prompt';
import { exportAsMarkdown, exportAsJSON, downloadFile } from '../utils/export';
import { compressToBase64 } from '../utils/compress';
import { getStorageBytes } from '../utils/storage';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { CharacterPicker } from './CharacterPicker';
import { Avatar } from './Avatar';
import type { Character } from '../types';

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const conversation = useConversationStore(
    (s) => s.conversations.find((c) => c.id === conversationId),
  );
  const renameConversation = useConversationStore((s) => s.renameConversation);
  const updateCharacters = useConversationStore((s) => s.updateCharacters);
  const branchConversation = useConversationStore((s) => s.branchConversation);
  const createConversation = useConversationStore((s) => s.createConversation);
  const isConfigured = useSettingsStore((s) => {
    if (s.defaultProvider === 'custom') return !!s.customBaseUrl;
    const key = s.apiKeys[s.defaultProvider];
    return !!key && key.trim().length > 0;
  });

  const singleChat = useChat();
  const roundtable = useRoundtable();

  const bottomRef = useRef<HTMLDivElement>(null);
  const lang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const [rounds, setRounds] = useState(3);
  const [showPicker, setShowPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgValue, setEditingMsgValue] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'tooLong'>('idle');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const storageOverLimit = useMemo(() => getStorageBytes() > 4.8 * 1024 * 1024, []);
  const summarizeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  if (!conversation) return null;

  const isMulti = conversation.characters.length > 1;
  const { isGenerating, error } = isMulti ? roundtable : singleChat;
  const stopGenerating = isMulti ? roundtable.stop : singleChat.stop;

  const characters = conversation.characters
    .map((id) => presetCharacters.find((c) => c.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof presetCharacters.find>>[];

  const firstChar = characters[0];

  const displayTitle = conversation.title
    || characters.map((c) => c.name[lang] || c.name.en).join(', ')
    || t('chat.untitled');

  const startEditTitle = () => {
    setTitleValue(displayTitle);
    setEditingTitle(true);
  };

  const finishEditTitle = () => {
    if (titleValue.trim()) {
      renameConversation(conversationId, titleValue.trim());
    }
    setEditingTitle(false);
  };

  const handleAddParticipant = (char: Character) => {
    const newChars = [...conversation.characters, char.id];
    updateCharacters(conversationId, newChars);
  };

  const handleRemoveParticipant = (charId: string) => {
    if (conversation.characters.length <= 1) return;
    const newChars = conversation.characters.filter((id) => id !== charId);
    updateCharacters(conversationId, newChars);
  };

  const handleRetryFrom = (messageId: string) => {
    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return;

    // Remove this message and everything after it
    useConversationStore.getState().removeMessagesFrom(conversationId, messageId);

    if (msg.role === 'user') {
      // Re-send the same user message → triggers full roundtable or single chat
      handleSend(msg.content);
    } else if (isMulti) {
      // Roundtable: continue from this character through remaining rounds
      roundtable.continueFrom(conversationId, msg.characterId!, rounds);
    } else {
      // Single chat: regenerate just this character response
      singleChat.regenerate(conversationId);
    }
  };

  const handleSend = (content: string) => {
    if (isMulti) {
      roundtable.sendMessage(conversationId, content, rounds);
    } else {
      singleChat.sendMessage(conversationId, content);
    }
  };

  const handleSummarize = async () => {
    const provider = resolveProvider();
    if (!provider) return;
    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv || conv.messages.length === 0) return;

    const transcript = conv.messages.map((msg) => {
      if (msg.role === 'user') return `[User]: ${msg.content}`;
      const char = presetCharacters.find((c) => c.id === msg.characterId);
      const name = char ? (char.name[lang] || char.name.en) : msg.characterId || 'Unknown';
      return `[${name}]: ${msg.content}`;
    }).join('\n\n');

    const summaryPrompt = 'Summarize the following conversation concisely. Extract core viewpoints, key disagreements, and conclusions. Stay neutral and impersonal.' + getLangInstruction(lang);

    const controller = new AbortController();
    summarizeAbortRef.current = controller;
    setIsSummarizing(true);
    try {
      await streamResponse(conversationId, undefined, [
        { role: 'system', content: summaryPrompt },
        { role: 'user', content: transcript },
      ], provider, controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      summarizeAbortRef.current = null;
      setIsSummarizing(false);
    }
  };

  const charNames = Object.fromEntries(
    characters.map((c) => [c.id, c.name[lang] || c.name.en]),
  );

  const handleExportMarkdown = () => {
    const md = exportAsMarkdown(conversation, charNames);
    downloadFile(md, `${displayTitle}.md`, 'text/markdown');
  };

  const handleExportJSON = () => {
    const json = exportAsJSON(conversation);
    downloadFile(json, `${displayTitle}.json`, 'application/json');
  };

  const handleShare = async () => {
    setShareStatus('sharing');
    try {
      const payload = JSON.stringify({
        title: conversation.title,
        characters: conversation.characters,
        messages: conversation.messages.map((m) => ({
          role: m.role,
          characterId: m.characterId,
          content: m.content,
        })),
      });
      const base64 = await compressToBase64(payload);
      const origin = window.location.origin + window.location.pathname;
      let url = `${origin}#/shared/${base64}`;

      // Short link: enabled when CORS proxy matches VITE_SHORT_LINK_URL env var
      const shortLinkUrl = import.meta.env.VITE_SHORT_LINK_URL;
      const corsProxy = useSettingsStore.getState().corsProxy;
      if (shortLinkUrl && corsProxy === shortLinkUrl) {
        const cacheKey = 'legend-talk-short-links';
        const cache: Record<string, string> = JSON.parse(localStorage.getItem(cacheKey) || '{}');
        // Use first 16 chars of SHA-256 hex as cache key (collision-resistant)
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base64));
        const hashKey = Array.from(new Uint8Array(hashBuf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');

        if (cache[hashKey]) {
          url = `${origin}#/shared/s:${cache[hashKey]}`;
        } else {
          try {
            const res = await fetch(`${corsProxy}/shorten`, { method: 'POST', body: base64 });
            if (res.ok) {
              const { id } = await res.json();
              cache[hashKey] = id;
              localStorage.setItem(cacheKey, JSON.stringify(cache));
              url = `${origin}#/shared/s:${id}`;
            }
          } catch { /* shortener unavailable, fall back to long URL */ }
        }
      }

      if (url.length > 32000) {
        setShareStatus('tooLong');
        setTimeout(() => setShareStatus('idle'), 3000);
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
    } catch {
      setShareStatus('idle');
      return;
    }
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  const hasMessages = conversation.messages.length > 0;

  const speakerChar = roundtable.currentSpeaker
    ? presetCharacters.find((c) => c.id === roundtable.currentSpeaker)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Title bar */}
      <div className="flex flex-wrap items-center gap-2 px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        {editingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={finishEditTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finishEditTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            autoFocus
            className="flex-1 min-w-0 text-sm font-semibold px-1 py-0 border border-blue-500 rounded bg-white dark:bg-gray-800 focus:outline-none"
          />
        ) : (
          <span
            className="font-semibold cursor-pointer hover:opacity-70 truncate"
            onClick={startEditTitle}
            title={t('chat.rename')}
          >
            {displayTitle}
          </span>
        )}
        {isMulti && (
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-gray-500">{t('roundtable.rounds')}</label>
            <input
              type="number"
              min={1}
              max={100}
              value={rounds}
              onChange={(e) => setRounds(Math.max(1, Math.min(100, Number(e.target.value))))}
              disabled={isGenerating}
              className="w-14 px-1 py-0.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center"
            />
          </div>
        )}
      </div>

      {/* Participants bar */}
      <div className="flex flex-wrap items-center gap-1 px-2 sm:px-4 py-1.5 border-b border-gray-200 dark:border-gray-700">
        {characters.map((char) => (
          <div
            key={char.id}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${
              isMulti && roundtable.currentSpeaker === char.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''
            }`}
          >
            <Avatar emoji={char.avatar} color={char.color} size="sm" />
            <span className="text-xs">{char.name[lang] || char.name.en}</span>
            {isMulti && !isGenerating && conversation.characters.length > 2 && (
              <button
                onClick={() => handleRemoveParticipant(char.id)}
                className="text-gray-400 hover:text-red-500 text-xs ml-0.5"
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
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
            >
              + {t('chat.addParticipant')}
            </button>
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}#/chat?chars=${conversation.characters.join(',')}`;
                navigator.clipboard.writeText(url);
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4">
        {storageOverLimit && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <span className="text-sm text-orange-700 dark:text-orange-300">{t('chat.storageWarning')}</span>
            <button
              onClick={() => navigate('/settings')}
              className="text-sm font-medium text-orange-700 dark:text-orange-300 hover:underline shrink-0"
            >
              {t('chat.goSettings')}
            </button>
          </div>
        )}
        {!isConfigured && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <span className="text-sm text-amber-700 dark:text-amber-300">{t('chat.noApiKey')}</span>
            <button
              onClick={() => navigate('/settings')}
              className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
            >
              {t('chat.goSettings')}
            </button>
          </div>
        )}
        {!hasMessages && firstChar && !isMulti && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">{t('chat.noMessages')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(firstChar.sampleQuestions[lang] || firstChar.sampleQuestions.en).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {conversation.messages.map((msg, idx) => {
          const msgChar = msg.characterId
            ? presetCharacters.find((c) => c.id === msg.characterId)
            : undefined;
          // Show divider before a user message that follows a character message (round boundary)
          const prevMsg = idx > 0 ? conversation.messages[idx - 1] : null;
          const showDivider = isMulti && msg.role === 'user' && prevMsg?.role === 'character';
          return (
            <div key={msg.id}>
              {showDivider && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">{t('roundtable.discussionComplete')}</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              )}
              <div className="group">
                {editingMsgId === msg.id ? (
                  <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'user' ? (
                      <div className="w-8 shrink-0" />
                    ) : (
                      <div className="w-8 shrink-0" />
                    )}
                    <div className="flex-1 max-w-[90%] sm:max-w-[75%]">
                      <textarea
                        value={editingMsgValue}
                        onChange={(e) => setEditingMsgValue(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-500 bg-white dark:bg-gray-800 focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => {
                            useConversationStore.getState().updateMessageContent(conversationId, msg.id, editingMsgValue);
                            setEditingMsgId(null);
                          }}
                          className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white"
                        >
                          {t('chat.send')}
                        </button>
                        <button
                          onClick={() => setEditingMsgId(null)}
                          className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <MessageBubble
                    content={msg.content}
                    isUser={msg.role === 'user'}
                    avatar={msgChar?.avatar}
                    color={msgChar?.color}
                    name={isMulti && msgChar ? (msgChar.name[lang] || msgChar.name.en) : undefined}
                  />
                )}
                {!isGenerating && !isSummarizing && editingMsgId !== msg.id && (
                  <div className={`flex gap-0.5 mt-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end pr-11' : 'pl-11'}`}>
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800"
                      title="Copy"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { setEditingMsgId(msg.id); setEditingMsgValue(msg.content); }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRetryFrom(msg.id)}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800"
                      title={t('chat.regenerate')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const newId = branchConversation(conversationId, msg.id);
                        if (newId) navigate(`/chat/${newId}`);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800"
                      title={t('chat.branch')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="6" y1="3" x2="6" y2="15" />
                        <circle cx="18" cy="6" r="3" />
                        <circle cx="6" cy="18" r="3" />
                        <path d="M18 9a9 9 0 0 1-9 9" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isGenerating && isMulti && speakerChar && roundtable.currentRound && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>{t('roundtable.roundProgress', {
              current: roundtable.currentRound,
              total: roundtable.totalRounds,
              name: speakerChar.name[lang] || speakerChar.name.en,
            })}</span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <button onClick={stopGenerating} className="ml-2 text-xs px-2.5 py-1 rounded-full border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100">{t('chat.stop')}</button>
          </div>
        )}
        {isGenerating && !isMulti && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>{t('chat.thinking')}</span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <button onClick={stopGenerating} className="ml-2 text-xs px-2.5 py-1 rounded-full border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100">{t('chat.stop')}</button>
          </div>
        )}
        {error && (() => {
          const s = useSettingsStore.getState();
          const isCors = !s.corsEnabled[s.defaultProvider] && /Failed to fetch|NetworkError|Load failed/.test(error);
          return isCors ? (
            <div className="flex flex-wrap items-center gap-2 text-sm px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <span className="text-amber-700 dark:text-amber-300">{t('chat.corsError')}</span>
              <button
                onClick={() => {
                  useSettingsStore.getState().setCorsEnabled(s.defaultProvider, true);
                  const lastUserMsg = [...conversation.messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMsg) handleRetryFrom(lastUserMsg.id);
                }}
                className="text-xs px-2.5 py-1 rounded bg-amber-500 text-white hover:bg-amber-600"
              >
                {t('chat.useCorsProxy')}
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="text-xs px-2 py-1 rounded text-amber-700 dark:text-amber-300 hover:underline"
              >
                {t('chat.goSettings')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <span>{t('common.error', { message: error })}</span>
              <button
                onClick={() => navigate('/settings')}
                className="shrink-0 text-xs px-2 py-0.5 rounded border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {t('chat.goSettings')}
              </button>
            </div>
          );
        })()}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-2 sm:px-4 pt-1">
        {hasMessages && !isGenerating && !isSummarizing && (
          <>
            {isMulti && (
              <button
                onClick={() => roundtable.addRounds(conversationId, rounds)}
                className="text-xs px-3 py-2 rounded-full border border-blue-400 dark:border-blue-500 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
              >
                {t('roundtable.continue', { count: rounds })}
              </button>
            )}
            <button
              onClick={handleSummarize}
              className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              {t('chat.summarize')}
            </button>
            <button
              onClick={() => {
                const type = conversation.characters.length > 1 ? 'roundtable' : 'single';
                const convId = createConversation(type, conversation.characters);
                navigate(`/chat/${convId}`);
              }}
              className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
            >
              {t('chat.newWithSame')}
            </button>
            <button
              onClick={handleShare}
              disabled={shareStatus === 'sharing'}
              className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {shareStatus === 'sharing'
                ? '...'
                : shareStatus === 'copied'
                  ? t('chat.copied')
                  : shareStatus === 'tooLong'
                    ? t('chat.shareTooLong')
                    : t('chat.share')}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="text-xs px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
              >
                {t('chat.export')} ▾
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute bottom-full left-0 mb-1 py-1 min-w-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20">
                    <button
                      onClick={() => { handleExportMarkdown(); setShowExportMenu(false); }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => { handleExportJSON(); setShowExportMenu(false); }}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
                    >
                      JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        {isSummarizing && (
          <span className="text-xs text-gray-400">
            {t('chat.summarizing')}
            <button onClick={() => summarizeAbortRef.current?.abort()} className="ml-2 text-xs px-2.5 py-1 rounded-full border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100">{t('chat.stop')}</button>
          </span>
        )}
      </div>
      <ChatInput onSend={handleSend} disabled={isGenerating || isSummarizing} />

      {showPicker && (
        <CharacterPicker
          onSelect={handleAddParticipant}
          onClose={() => setShowPicker(false)}
          excludeIds={conversation.characters}
        />
      )}
    </div>
  );
}
