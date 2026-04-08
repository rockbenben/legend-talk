import { useLangPath } from '../hooks/useLangPath';
import { currentLang } from '../utils/lang';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../stores/conversations';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { useRoundtable } from '../hooks/useRoundtable';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { getLangInstruction, resolveProvider, streamResponse, suggestCharacters } from '../utils/prompt';
import { compressToBase64 } from '../utils/compress';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { CharacterPicker } from './CharacterPicker';
import { ParticipantsBar } from './ParticipantsBar';
import { ActionBar } from './ActionBar';
import type { Character } from '../types';

/** Check if a characterId is an analysis marker (not a real character) */
function isAnalysisMsg(characterId?: string): boolean {
  return !!characterId?.startsWith('__') && !!characterId?.endsWith('__');
}

const ANALYSIS_META: Record<string, { emoji: string; labelKey: string }> = {
  '__summarize__': { emoji: '📋', labelKey: 'chat.summarize' },
  '__moderator__': { emoji: '⚖️', labelKey: 'moderator.name' },
};

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const conversation = useConversationStore(
    (s) => s.conversations.find((c) => c.id === conversationId),
  );
  const renameConversation = useConversationStore((s) => s.renameConversation);
  const updateCharacters = useConversationStore((s) => s.updateCharacters);
  const branchConversation = useConversationStore((s) => s.branchConversation);
  const isConfigured = useSettingsStore((s) => {
    if (s.defaultProvider === 'custom') return !!s.customBaseUrl;
    const key = s.apiKeys[s.defaultProvider];
    return !!key && key.trim().length > 0;
  });

  const singleChat = useChat(conversationId);
  const roundtable = useRoundtable(conversationId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lang = currentLang();
  const rounds = useSettingsStore((s) => s.roundtableRounds);
  const setRounds = useSettingsStore((s) => s.setRoundtableRounds);
  const [showPicker, setShowPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgValue, setEditingMsgValue] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'tooLong'>('idle');
  const summarizeAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Auto-summon characters and start discussion from topic input
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonError, setSummonError] = useState<string | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const summonRef = useRef(false);

  const summonAbortRef = useRef<AbortController | null>(null);

  const startSummon = (topic: string) => {
    const provider = resolveProvider();
    if (!provider) { setSummonError(null); return; } // Will show isConfigured warning

    summonAbortRef.current?.abort();
    const controller = new AbortController();
    summonAbortRef.current = controller;

    setIsSummoning(true);
    setSummonError(null);
    const allChars = presetCharacters.map((c) => ({ id: c.id, domain: c.domain[0] }));
    suggestCharacters(topic, provider, allChars, controller.signal)
      .then((charIds) => {
        if (charIds.length >= 2) {
          useConversationStore.getState().updateCharacters(conversationId, charIds);
          setPendingTopic(null);
          roundtable.sendMessage(conversationId, topic, rounds);
        } else {
          setSummonError(t('chat.summonFailed'));
        }
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSummonError(err instanceof Error ? err.message : t('common.error', { message: '' }));
      })
      .finally(() => { setIsSummoning(false); summonAbortRef.current = null; });
  };

  useEffect(() => {
    if (summonRef.current) return;
    try {
      const raw = sessionStorage.getItem('legend-talk-auto-topic');
      if (!raw) return;
      const { convId, topic } = JSON.parse(raw) as { convId: string; topic: string };
      if (convId !== conversationId) return;
      sessionStorage.removeItem('legend-talk-auto-topic');
      summonRef.current = true;
      setPendingTopic(topic);
      startSummon(topic);
    } catch { /* ignore */ }
  }, [conversationId]);

  if (!conversation) return null;

  const isMulti = conversation.characters.length > 1;
  const { isGenerating, error } = isMulti ? roundtable : singleChat;
  const stopGenerating = isMulti ? roundtable.stop : singleChat.stop;

  const characters = conversation.characters
    .map((id) => presetCharacters.find((c) => c.id === id))
    .filter(Boolean) as NonNullable<ReturnType<typeof presetCharacters.find>>[];

  const firstChar = characters[0];

  const displayTitle = conversation.title
    || characters.map((c) => t(`characters.${c.id}.name`)).join(', ')
    || t('chat.untitled');

  const startEditTitle = () => { setTitleValue(displayTitle); setEditingTitle(true); };
  const finishEditTitle = () => {
    if (titleValue.trim()) renameConversation(conversationId, titleValue.trim());
    setEditingTitle(false);
  };

  const handleSend = (content: string) => {
    if (isMulti) roundtable.sendMessage(conversationId, content, rounds);
    else singleChat.sendMessage(conversationId, content);
  };

  const handleRetryFrom = (messageId: string) => {
    if (isGenerating || isSummarizing) return;
    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return;
    useConversationStore.getState().removeMessagesFrom(conversationId, messageId);
    if (msg.role === 'user') {
      handleSend(msg.content);
    } else if (msg.characterId === '__moderator__') {
      roundtable.retryModerator(conversationId);
    } else if (isAnalysisMsg(msg.characterId)) {
      handleSummarize();
    } else if (isMulti) {
      roundtable.continueFrom(conversationId, msg.characterId!, rounds);
    } else {
      singleChat.regenerate(conversationId);
    }
  };

  const handleSummarize = async () => {
    const provider = resolveProvider();
    if (!provider) { navigate(lp('/settings')); return; }
    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv || conv.messages.length === 0) return;
    const transcript = conv.messages
      .filter((msg) => msg.role === 'user' || msg.characterId === '__moderator__' || (msg.characterId && !isAnalysisMsg(msg.characterId)))
      .map((msg) => {
        if (msg.role === 'user') return `[User]: ${msg.content}`;
        if (msg.characterId === '__moderator__') return `[${t('moderator.name')}]: ${msg.content}`;
        const char = presetCharacters.find((c) => c.id === msg.characterId);
        const name = char ? t(`characters.${char.id}.name`) : msg.characterId || 'Unknown';
        return `[${name}]: ${msg.content}`;
      }).join('\n\n');
    const controller = new AbortController();
    summarizeAbortRef.current = controller;
    setIsSummarizing(true);
    try {
      await streamResponse(conversationId, '__summarize__', [
        { role: 'system', content: 'Summarize this discussion. Highlight each viewpoint, key disagreements, and insights worth remembering. Stay neutral. Match summary length to discussion length.' + getLangInstruction(lang) },
        { role: 'user', content: transcript },
      ], provider, controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      summarizeAbortRef.current = null;
      setIsSummarizing(false);
    }
  };

  const handleShare = async () => {
    setShareStatus('sharing');
    try {
      const payload = JSON.stringify({
        title: conversation.title,
        characters: conversation.characters,
        messages: conversation.messages.map((m) => ({ role: m.role, characterId: m.characterId, content: m.content })),
      });
      const base64 = await compressToBase64(payload);
      const origin = window.location.origin + window.location.pathname;
      let url = `${origin}#/shared/${base64}`;
      const corsProxy = useSettingsStore.getState().corsProxy;
      const noShortKey = 'legend-talk-no-shorten';
      let noShortList: string[] = [];
      try { noShortList = JSON.parse(sessionStorage.getItem(noShortKey) || '[]'); } catch { /* ok */ }
      if (corsProxy && !noShortList.includes(corsProxy)) {
        const cacheKey = 'legend-talk-short-links';
        let cache: Record<string, string> = {};
        try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch { /* ok */ }
        const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(base64));
        const hashKey = Array.from(new Uint8Array(hashBuf)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
        const proxyTag = btoa(corsProxy).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        if (cache[hashKey]) {
          url = `${origin}#/shared/s:${proxyTag}:${cache[hashKey]}`;
        } else {
          try {
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), 3000);
            const res = await fetch(`${corsProxy}/shorten`, { method: 'POST', body: base64, signal: ac.signal });
            clearTimeout(timer);
            if (res.ok) {
              const { id } = await res.json();
              cache[hashKey] = id;
              const keys = Object.keys(cache);
              if (keys.length > 200) { for (const k of keys.slice(0, keys.length - 200)) delete cache[k]; }
              try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch { /* ok */ }
              url = `${origin}#/shared/s:${proxyTag}:${id}`;
            } else {
              noShortList.push(corsProxy);
              try { sessionStorage.setItem(noShortKey, JSON.stringify(noShortList)); } catch { /* ok */ }
            }
          } catch {
            noShortList.push(corsProxy);
            try { sessionStorage.setItem(noShortKey, JSON.stringify(noShortList)); } catch { /* ok */ }
          }
        }
      }
      if (url.length > 32000) { setShareStatus('tooLong'); setTimeout(() => setShareStatus('idle'), 3000); return; }
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
    } catch {
      setShareStatus('idle');
      return;
    }
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  const speakerChar = roundtable.currentSpeaker
    ? presetCharacters.find((c) => c.id === roundtable.currentSpeaker) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {pendingTopic && !isMulti && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-auto">
          <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-xl bg-white/95 dark:bg-gray-800/95 shadow-lg border border-gray-200 dark:border-gray-700 max-w-sm mx-4">
            {isSummoning ? (
              <>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('home.suggesting')}</span>
              </>
            ) : !isConfigured ? (
              <>
                <span className="text-sm text-amber-700 dark:text-amber-300">{t('chat.noApiKey')}</span>
                <div className="flex gap-2">
                  <button onClick={() => navigate(lp('/settings'))} className="text-sm px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600">{t('chat.goSettings')}</button>
                  <button onClick={() => startSummon(pendingTopic)} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400">{t('chat.retry')}</button>
                </div>
              </>
            ) : summonError ? (
              <>
                <span className="text-sm text-red-500">{summonError}</span>
                <div className="flex gap-2">
                  <button onClick={() => startSummon(pendingTopic)} className="text-sm px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600">{t('chat.retry')}</button>
                  <button onClick={() => navigate(lp('/settings'))} className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400">{t('chat.goSettings')}</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* Title bar */}
      <div className="flex flex-wrap items-center gap-2 px-2 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        {editingTitle ? (
          <input
            type="text" value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={finishEditTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') finishEditTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
            autoFocus
            className="flex-1 min-w-0 text-sm font-semibold px-1 py-0 border border-blue-500 rounded bg-white dark:bg-gray-800 focus:outline-none"
          />
        ) : (
          <span className="font-semibold cursor-pointer hover:opacity-70 truncate min-w-0 flex-1" onClick={startEditTitle} title={t('chat.rename')}>
            {displayTitle}
          </span>
        )}
        {isMulti && (
          <div className="flex items-center gap-2 ms-auto shrink-0">
            <label className="text-xs text-gray-500 whitespace-nowrap">{t('roundtable.rounds')}</label>
            <input
              type="number" min={1} max={100} value={rounds}
              onChange={(e) => setRounds(Math.max(1, Math.min(100, Number(e.target.value))))}
              disabled={isGenerating}
              className="w-12 px-1 py-0.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-center"
            />
          </div>
        )}
      </div>

      <ParticipantsBar
        characters={characters}
        conversationCharIds={conversation.characters}
        isMulti={isMulti}
        isGenerating={isGenerating}
        currentSpeaker={roundtable.currentSpeaker}
        onAdd={() => setShowPicker(true)}
        onRemove={(charId) => {
          if (conversation.characters.length <= 1) return;
          updateCharacters(conversationId, conversation.characters.filter((id) => id !== charId));
        }}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-4">
        {!isConfigured && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <span className="text-sm text-amber-700 dark:text-amber-300">{t('chat.noApiKey')}</span>
            <button onClick={() => navigate(lp('/settings'))} className="text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline">
              {t('chat.goSettings')}
            </button>
          </div>
        )}
        {conversation.characters.length === 0 && conversation.messages.length === 0 && !pendingTopic && !isSummoning && conversation.title && (
          <div className="flex flex-col items-center justify-center py-16 gap-5">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200 max-w-md text-center">"{conversation.title}"</p>
            <button
              onClick={() => {
                setPendingTopic(conversation.title!);
                startSummon(conversation.title!);
              }}
              className="px-6 py-3 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
            >
              {t('chat.aiPickAndDiscuss')}
            </button>
          </div>
        )}
        {conversation.messages.length === 0 && firstChar && !isMulti && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">{t('chat.noMessages')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {(t(`characters.${firstChar.id}.questions`, { returnObjects: true }) as string[]).map((q) => (
                <button key={q} onClick={() => handleSend(q)} className="px-3 py-2 sm:py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {conversation.messages.map((msg, idx) => {
          const msgChar = msg.characterId ? presetCharacters.find((c) => c.id === msg.characterId) : undefined;
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
                    <div className="w-8 shrink-0" />
                    <div className="flex-1 max-w-[90%] sm:max-w-[75%]">
                      <textarea value={editingMsgValue} onChange={(e) => setEditingMsgValue(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-500 bg-white dark:bg-gray-800 focus:outline-none resize-none" rows={3} autoFocus />
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => { if (editingMsgValue.trim()) useConversationStore.getState().updateMessageContent(conversationId, msg.id, editingMsgValue.trim()); setEditingMsgId(null); }}
                          className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white">{t('chat.send')}</button>
                        <button onClick={() => setEditingMsgId(null)} className="text-xs px-2 py-0.5 rounded text-gray-500 hover:text-gray-700">✕</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <MessageBubble
                    content={msg.content} isUser={msg.role === 'user'}
                    avatar={msgChar?.avatar || (isAnalysisMsg(msg.characterId) ? (ANALYSIS_META[msg.characterId!]?.emoji || '📋') : undefined)}
                    color={msgChar?.color || (isAnalysisMsg(msg.characterId) ? 'blue' : undefined)}
                    name={isMulti && msgChar ? t(`characters.${msgChar.id}.name`) : (isAnalysisMsg(msg.characterId) ? t(ANALYSIS_META[msg.characterId!]?.labelKey || 'chat.summarize') : undefined)}
                  />
                )}
                {!isGenerating && !isSummarizing && editingMsgId !== msg.id && (
                  <div className={`flex gap-0.5 mt-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end pe-11' : 'ps-11'}`}>
                    <button onClick={() => navigator.clipboard.writeText(msg.content).catch(() => {})}
                      className="p-2 sm:p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800" title="Copy">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <button onClick={() => { setEditingMsgId(msg.id); setEditingMsgValue(msg.content); }}
                      className="p-2 sm:p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => handleRetryFrom(msg.id)}
                      className="p-2 sm:p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800" title={t('chat.regenerate')}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                    <button onClick={() => { const newId = branchConversation(conversationId, msg.id); if (newId) navigate(lp(`/chat/${newId}`)); }}
                      className="p-2 sm:p-1.5 text-gray-400 hover:text-blue-500 rounded-md active:bg-gray-100 dark:active:bg-gray-800" title={t('chat.branch')}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                        <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isGenerating && (
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <span>{isMulti && roundtable.currentRound
              ? (roundtable.currentSpeaker === '__moderator__' || speakerChar)
                ? t('roundtable.roundProgress', { current: roundtable.currentRound, total: roundtable.totalRounds, name: roundtable.currentSpeaker === '__moderator__' ? t('moderator.synthesizing') : t(`characters.${speakerChar!.id}.name`) })
                : `${roundtable.currentRound}/${roundtable.totalRounds} — ${t('chat.thinking')}`
              : t('chat.thinking')}</span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <button onClick={stopGenerating} className="ms-2 text-xs px-2.5 py-1 rounded-full border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100">{t('chat.stop')}</button>
          </div>
        )}
        {error && (() => {
          const s = useSettingsStore.getState();
          const isCors = !s.corsEnabled[s.defaultProvider] && /Failed to fetch|NetworkError|Load failed/.test(error);
          return isCors ? (
            <div className="flex flex-wrap items-center gap-2 text-sm px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <span className="text-amber-700 dark:text-amber-300">{t('chat.corsError')}</span>
              <button onClick={() => { useSettingsStore.getState().setCorsEnabled(s.defaultProvider, true); const lastUserMsg = [...conversation.messages].reverse().find((m) => m.role === 'user'); if (lastUserMsg) handleRetryFrom(lastUserMsg.id); }}
                className="text-xs px-2.5 py-1 rounded bg-amber-500 text-white hover:bg-amber-600">{t('chat.useCorsProxy')}</button>
              <button onClick={() => navigate(lp('/settings'))} className="text-xs px-2 py-1 rounded text-amber-700 dark:text-amber-300 hover:underline">{t('chat.goSettings')}</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <span>{t('common.error', { message: error })}</span>
              <button onClick={() => navigate(lp('/settings'))} className="shrink-0 text-xs px-2 py-0.5 rounded border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">{t('chat.goSettings')}</button>
            </div>
          );
        })()}
        <div ref={bottomRef} />
      </div>

      <ActionBar
        conversation={conversation} characters={characters} displayTitle={displayTitle}
        isMulti={isMulti} isGenerating={isGenerating} isSummarizing={isSummarizing}
        rounds={rounds} shareStatus={shareStatus}
        onContinue={() => roundtable.addRounds(conversationId, rounds)}
        onSummarize={handleSummarize} onShare={handleShare}
        onStopSummarize={() => summarizeAbortRef.current?.abort()}
      />
      <ChatInput onSend={handleSend} disabled={isGenerating || isSummarizing} />

      {showPicker && (
        <CharacterPicker
          onSelect={(char: Character) => { updateCharacters(conversationId, [...conversation.characters, char.id]); }}
          onClose={() => setShowPicker(false)}
          excludeIds={conversation.characters}
        />
      )}
    </div>
  );
}
