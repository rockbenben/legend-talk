import { useLangPath } from '../hooks/useLangPath';
import { currentLang } from '../utils/lang';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../stores/conversations';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Spin, Alert, Typography, Divider, Space, Card } from 'antd';
import { CopyOutlined, EditOutlined, ReloadOutlined, BranchesOutlined, ArrowRightOutlined, AimOutlined } from '@ant-design/icons';
import { Virtuoso } from 'react-virtuoso';
import { useChat } from '../hooks/useChat';
import { useRoundtable } from '../hooks/useRoundtable';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { getLangInstruction, isProviderConfigured, resolveProvider, streamResponse, suggestCharacters } from '../utils/prompt';
import { compressToBase64 } from '../utils/compress';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { CharacterPicker } from './CharacterPicker';
import { ParticipantsBar } from './ParticipantsBar';
import { ActionBar } from './ActionBar';
import type { Character, Message } from '../types';

const { Text, Title } = Typography;

/** The proceedings column. 880 − the 140px marginal label = ~45 CJK characters
 *  of measure; at the old 1200 a speech ran to 55+, past comfortable reading.
 *  The note, transcript, action row and composer all sit on this same column —
 *  they are one document, not a document plus chrome. */
const COLUMN: React.CSSProperties = { maxWidth: 880, width: '100%', margin: '0 auto' };
const GUTTER = '0 clamp(16px, 5vw, 96px)';

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
  // ⚠ 判据只有一份（prompt.ts）。抄一份到这里，横幅与 resolveProvider 就会各
  // 说各话 —— 目录里再多一家 keyOptional，这里不会知道。
  const isConfigured = useSettingsStore(isProviderConfigured);

  const singleChat = useChat(conversationId);
  const roundtable = useRoundtable(conversationId);

  const contentRef = useRef<HTMLDivElement>(null);
  const lang = currentLang();
  const rounds = useSettingsStore((s) => s.roundtableRounds);
  const setRounds = useSettingsStore((s) => s.setRoundtableRounds);
  const [showPicker, setShowPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingMsgValue, setEditingMsgValue] = useState('');
  const [pendingRetryMsgId, setPendingRetryMsgId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'tooLong'>('idle');
  const summarizeAbortRef = useRef<AbortController | null>(null);

  const [isSummoning, setIsSummoning] = useState(false);
  const [summonError, setSummonError] = useState<string | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const summonRef = useRef(false);
  const summonAbortRef = useRef<AbortController | null>(null);

  // Scroll-container DOM ref (callback form so Virtuoso re-mounts once it's
  // attached). Virtuoso virtualizes the messages list while leaving the hero,
  // generating spinner, and error banners as plain inline children of this same
  // scroll container.
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  // O(1) character lookup. Without this, `presetCharacters.find()` runs once
  // per message per re-render — O(messages × characters) = 200 × 161 ≈ 32k
  // string comparisons per render during streaming. presetCharacters is
  // mutable (custom characters are pushed), so the Map rebuilds when length
  // changes.
  const charMap = useMemo(
    () => new Map(presetCharacters.map((c) => [c.id, c])),
    [presetCharacters.length], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const charKey = conversation?.characters.join(',') ?? '';
  const templateId = conversation?.templateId;
  const roundtableTopics = useMemo(() => {
    if (!conversation || conversation.type !== 'roundtable' || conversation.characters.length === 0) return [];
    if (templateId) {
      const q = t(`templates.${templateId}.questions`, { returnObjects: true });
      return Array.isArray(q) ? q as string[] : [];
    }
    const chars = [...conversation.characters];
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.slice(0, 5).map((cid) => {
      const q = t(`characters.${cid}.questions`, { returnObjects: true });
      if (!Array.isArray(q) || q.length === 0) return null;
      return q[Math.floor(Math.random() * q.length)] as string;
    }).filter((q, i, arr): q is string => q !== null && arr.indexOf(q) === i);
  }, [charKey, templateId, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setShowPicker(false);
    setEditingTitle(false);
    setEditingMsgId(null);
    setShareStatus('idle');
    setSummonError(null);
    setPendingTopic(null);
    summonRef.current = false;
    summonAbortRef.current?.abort();
    setIsSummoning(false);
    summarizeAbortRef.current?.abort();
    setIsSummarizing(false);
  }, [conversationId]);

  // ── Stick to bottom ────────────────────────────────────────────────────
  // Delegating this to Virtuoso's `followOutput` did not work: the scroll
  // container also holds the generating spinner, the error alerts and the
  // bottom anchor as siblings BELOW the list, so "list is at its bottom"
  // never means "container is at its bottom". Virtuoso reads that residual
  // gap as "the user scrolled up" and disengages — and a smooth
  // scrollIntoView animation feeds it intermediate offsets that disengage it
  // too. Streaming only changes message CONTENT, not message COUNT, so a
  // count-keyed effect never fired again either, and nothing at all ran when
  // generation ended and the spinner row unmounted. Net effect: the reply
  // landed below the fold and the reader had to drag down to see it.
  //
  // So own it against the container. A ResizeObserver catches every growth —
  // token flush, spinner unmount, alert appearing, images settling — in one
  // place, and the scroll listener records whether the reader deliberately
  // moved away, which is the only reason not to follow.
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    if (!scrollEl) return;
    const onScroll = () => {
      // 80px of slack: "close enough to the bottom to still be reading along".
      stickToBottomRef.current =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 80;
    };
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, [scrollEl]);

  useEffect(() => {
    const content = contentRef.current;
    if (!scrollEl || !content) return;
    // Instant, not smooth: at ~20Hz token flushes a smooth animation never
    // settles, and each restart is what disengaged the old follow logic.
    // Pin twice: once now, once after the next layout. Virtuoso is
    // virtualized, so jumping to the bottom makes it render further items and
    // re-estimate its spacer height — the scrollHeight read inside the
    // observer callback is stale by the time that lands, leaving the view a
    // line or so short. The rAF pass reads the settled value.
    let raf = 0;
    const pin = () => {
      if (!stickToBottomRef.current) return;
      scrollEl.scrollTop = scrollEl.scrollHeight;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (stickToBottomRef.current) scrollEl.scrollTop = scrollEl.scrollHeight;
      });
    };
    const ro = new ResizeObserver(pin);
    ro.observe(content);
    // The container too, not just its content: the composer and action row
    // grow as the conversation does, and that shortens the viewport out from
    // under a transcript already pinned to the bottom.
    ro.observe(scrollEl);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [scrollEl]);

  // Opening a conversation starts at the newest message.
  useEffect(() => {
    stickToBottomRef.current = true;
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }, [conversationId, scrollEl]);

  const startSummon = (topic: string) => {
    const provider = resolveProvider();
    if (!provider) { setSummonError(null); return; }

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
      .finally(() => {
        if (summonAbortRef.current === controller) {
          setIsSummoning(false);
          summonAbortRef.current = null;
        }
      });
  };

  useEffect(() => {
    if (summonRef.current) return;
    if (!conversation || conversation.characters.length > 0 || conversation.messages.length > 0 || !conversation.title) return;
    summonRef.current = true;
    setPendingTopic(conversation.title);
    startSummon(conversation.title);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setPendingRetryMsgId(null);
    if (isMulti) roundtable.sendMessage(conversationId, content, rounds);
    else singleChat.sendMessage(conversationId, content);
  };

  const handleRetryFrom = (messageId: string) => {
    if (isGenerating || isSummarizing) return;
    setPendingRetryMsgId(null);
    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg) return;

    if (isMulti && msg.role === 'user' && msg.focusSnapshot !== undefined) {
      roundtable.retryFromIntervention(conversationId, messageId);
      return;
    }

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
      .filter((msg) => msg.content.trim() && (msg.role === 'user' || msg.characterId === '__moderator__' || (msg.characterId && !isAnalysisMsg(msg.characterId))))
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
        { role: 'system', content: 'Summarize this roundtable. Distill the moves the discussion actually made — claims advanced, cruxes surfaced, concepts introduced, angles that shifted. Organize primarily by idea (themes, disagreements, insights worth remembering); attribute to speakers only when attribution matters for the idea. Treat the moderator as a process role, not a participant — their syntheses frame the discussion, they do not hold a position. Stay neutral. Match summary length to discussion length.' + getLangInstruction(lang) },
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
        messages: conversation.messages.filter((m) => m.content.trim()).map((m) => ({ role: m.role, characterId: m.characterId, content: m.content })),
      });
      const base64 = await compressToBase64(payload);
      const origin = window.location.origin + window.location.pathname;
      let url = `${origin}#/shared/${base64}`;
      // Strip trailing slashes — "proxy.com//shorten" 404s, and the proxyTag baked
      // into the share URL must be the canonical form for receivers.
      const corsProxy = useSettingsStore.getState().corsProxy.replace(/\/+$/, '');
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
      if (url.length > 32000) { setShareStatus('tooLong'); return; }
      await navigator.clipboard.writeText(url);
      setShareStatus('copied');
    } catch {
      setShareStatus('idle');
      return;
    }
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  const speakerChar = roundtable.currentSpeaker ? charMap.get(roundtable.currentSpeaker) ?? null : null;

  // Single-item renderer for Virtuoso. Lives inside the component so it closes
  // over editing state, conversation data, and handlers. Every item must render
  // with a non-zero size (Virtuoso errors on zero-sized elements) — the empty
  // trailing stub during streaming renders as a 1px spacer, never null.
  const renderMessage = (idx: number, msg: Message): React.ReactNode => {
    const msgChar = msg.characterId ? charMap.get(msg.characterId) : undefined;
    const prevMsg = idx > 0 ? conversation.messages[idx - 1] : null;
    const showDivider = isMulti && msg.role === 'user' && prevMsg?.role === 'character';
    // A character speech right after a moderator synthesis opens a new round —
    // typeset a「第 N 轮」rule like the printed proceedings.
    const showRoundRule = isMulti && msg.role === 'character' && msg.characterId && !msg.characterId.startsWith('__')
      && prevMsg?.characterId === '__moderator__';
    const roundNo = showRoundRule
      ? conversation.messages.slice(0, idx).filter((m) => m.characterId === '__moderator__').length + 1
      : 0;
    // Hide the trailing empty message while it streams in — but give Virtuoso a
    // measurable 1px box: returning null produces zero-sized items, which the
    // library flags as an error on every flush and which destabilises scroll math.
    if (!msg.content.trim() && isGenerating && idx === conversation.messages.length - 1) {
      return <div style={{ height: 1 }} aria-hidden />;
    }
    // Align action rows with the speech text column — except the moderator
    // synthesis, which is full-width (no margin column) so an indent reads as
    // misalignment.
    const afterSpeech = msg.role === 'user' || msg.characterId === '__moderator__' ? '' : ' lt-after-speech';

    if (msg.characterId === '__focus__') {
      const isLast = idx === conversation.messages.length - 1;
      const isEditing = editingMsgId === msg.id;
      const interactive = isLast && !isGenerating && !isSummarizing;
      return (
        <Alert
          type="info"
          icon={<AimOutlined />}
          showIcon
          style={{ margin: '12px 0' }}
          title={
            <Space orientation="vertical" style={{ width: '100%' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text strong>{t('roundtable.focus')}</Text>
                {interactive && !isEditing && (
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditingMsgId(msg.id); setEditingMsgValue(msg.content); }} />
                )}
              </Space>
              {isEditing ? (
                <>
                  <Input.TextArea autoFocus autoSize={{ minRows: 2 }} value={editingMsgValue} onChange={(e) => setEditingMsgValue(e.target.value)} />
                  <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                    <Button size="small" onClick={() => setEditingMsgId(null)}>{t('common.cancel')}</Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        if (editingMsgValue.trim()) {
                          useConversationStore.getState().updateMessageContent(conversationId, msg.id, editingMsgValue.trim());
                        }
                        setEditingMsgId(null);
                      }}
                    >
                      {t('common.save')}
                    </Button>
                  </Space>
                </>
              ) : (
                <>
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                  {interactive && (
                    <div style={{ textAlign: 'end' }}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<ArrowRightOutlined className="rtl:-scale-x-100" />}
                        iconPlacement="end"
                        onClick={() => roundtable.startFromFocus(conversationId, rounds)}
                      >
                        {t('roundtable.start')}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Space>
          }
        />
      );
    }

    return (
      <div>
        {showDivider && (
          <Divider plain>
            <Text type="secondary" className="display-serif lt-round-rule">
              {t('roundtable.discussionComplete')}
            </Text>
          </Divider>
        )}
        {showRoundRule && (
          <Divider plain style={{ marginTop: 36 }}>
            <Text type="secondary" className="display-serif lt-round-rule">
              {t('roundtable.roundLabel', { n: roundNo })}
            </Text>
          </Divider>
        )}
        <div className="group">
          {editingMsgId === msg.id ? (
            <div style={{ padding: '12px 0' }}>
              <Input.TextArea autoFocus autoSize={{ minRows: 2 }} value={editingMsgValue} onChange={(e) => setEditingMsgValue(e.target.value)} />
              <Space style={{ marginTop: 6 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => {
                    const trimmed = editingMsgValue.trim();
                    if (trimmed && trimmed !== msg.content.trim()) {
                      useConversationStore.getState().updateMessageContent(conversationId, msg.id, trimmed);
                      setPendingRetryMsgId(msg.id);
                    }
                    setEditingMsgId(null);
                  }}
                >
                  {t('chat.send')}
                </Button>
                <Button size="small" onClick={() => setEditingMsgId(null)}>✕</Button>
              </Space>
            </div>
          ) : (
            <MessageBubble
              content={msg.content}
              isUser={msg.role === 'user'}
              avatar={msgChar?.avatar || (isAnalysisMsg(msg.characterId) ? (ANALYSIS_META[msg.characterId!]?.emoji || '📋') : undefined)}
              color={msgChar?.color || (isAnalysisMsg(msg.characterId) ? 'blue' : undefined)}
              name={isMulti && msgChar ? t(`characters.${msgChar.id}.name`) : (isAnalysisMsg(msg.characterId) ? t(ANALYSIS_META[msg.characterId!]?.labelKey || 'chat.summarize') : undefined)}
              era={isMulti && msgChar ? t(`characters.${msgChar.id}.era`) : undefined}
              dropCap={isMulti && !!msgChar && (
                prevMsg?.role === 'user' || prevMsg?.characterId === '__moderator__' || prevMsg?.characterId === '__focus__'
              )}
              isModerator={msg.characterId === '__moderator__'}
              timestamp={msg.timestamp}
            />
          )}
          {!isGenerating && !isSummarizing && editingMsgId !== msg.id && (
            <div
              className={`group-hover:!opacity-100${afterSpeech}`}
              style={{
                display: 'flex',
                gap: 0,
                opacity: 0,
                transition: 'opacity 0.18s',
                marginTop: 4,
                ...(msg.role === 'user' ? { justifyContent: 'flex-end' } : {}),
              }}
            >
              <Button type="text" size="small" icon={<CopyOutlined />} style={{ color: 'var(--ant-color-text-tertiary)' }} onClick={() => navigator.clipboard.writeText(msg.content).catch(() => {})} title={t('chat.copy')} />
              <Button type="text" size="small" icon={<EditOutlined />} style={{ color: 'var(--ant-color-text-tertiary)' }} onClick={() => { setPendingRetryMsgId(null); setEditingMsgId(msg.id); setEditingMsgValue(msg.content); }} title={t('chat.edit')} />
              <Button type="text" size="small" icon={<ReloadOutlined />} style={{ color: 'var(--ant-color-text-tertiary)' }} onClick={() => handleRetryFrom(msg.id)} title={t('chat.regenerate')} />
              <Button type="text" size="small" icon={<BranchesOutlined />} style={{ color: 'var(--ant-color-text-tertiary)' }} onClick={() => { const newId = branchConversation(conversationId, msg.id); if (newId) navigate(lp(`/chat/${newId}`)); }} title={t('chat.branch')} />
            </div>
          )}
          {pendingRetryMsgId === msg.id && !isGenerating && !isSummarizing && editingMsgId !== msg.id && (
            <div
              className={afterSpeech.trim() || undefined}
              style={{
                marginTop: 4,
                display: 'flex',
                ...(msg.role === 'user' ? { justifyContent: 'flex-end' } : {}),
              }}
            >
              <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => handleRetryFrom(msg.id)}>
                {t('chat.applyEdit')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {pendingTopic && !isMulti && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'color-mix(in srgb, currentColor 6%, transparent)',
            backdropFilter: 'blur(2px)',
          }}
        >
          <Space orientation="vertical" align="center" size="middle" style={{ padding: 24, background: 'var(--ant-color-bg-elevated)', border: '1px solid var(--ant-color-border)', borderRadius: 'var(--ant-border-radius-lg)', maxWidth: 360 }}>
            {isSummoning ? (
              <>
                <Spin />
                <Text type="secondary">{t('home.suggesting')}</Text>
              </>
            ) : !isConfigured ? (
              <>
                <Text>{t('chat.noApiKey')}</Text>
                <Space>
                  <Button type="primary" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                  <Button onClick={() => startSummon(pendingTopic)}>{t('chat.retry')}</Button>
                </Space>
              </>
            ) : summonError ? (
              <>
                <Text type="danger">{summonError}</Text>
                <Space>
                  <Button type="primary" onClick={() => startSummon(pendingTopic)}>{t('chat.retry')}</Button>
                  <Button onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                </Space>
              </>
            ) : null}
          </Space>
        </div>
      )}

      {/* Title bar — no own border; the participants bar below carries the single hairline */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 20px 2px' }}>
        {editingTitle ? (
          <Input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={finishEditTitle}
            onPressEnter={finishEditTitle}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditingTitle(false); }}
            style={{ flex: 1, minWidth: 0 }}
          />
        ) : (
          <Title
            level={5}
            className="display-serif"
            ellipsis
            onClick={startEditTitle}
            title={t('chat.rename')}
            style={{ flex: 1, minWidth: 0, margin: 0, fontSize: 20, fontWeight: 600, cursor: 'pointer' }}
          >
            {displayTitle}
          </Title>
        )}
      </div>

      <ParticipantsBar
        characters={characters}
        conversationCharIds={conversation.characters}
        isMulti={isMulti}
        isGenerating={isGenerating}
        currentSpeaker={roundtable.currentSpeaker}
        currentRound={roundtable.currentRound}
        totalRounds={roundtable.totalRounds}
        rounds={rounds}
        onRoundsChange={setRounds}
        onAdd={() => setShowPicker(true)}
        onRemove={(charId) => {
          if (conversation.characters.length <= 1) return;
          updateCharacters(conversationId, conversation.characters.filter((id) => id !== charId));
        }}
      />

      {/* A precondition, not a message — kept out of the scroll container so it
          can't scroll away behind the transcript. */}
      {!isConfigured && (
        <div style={{ padding: GUTTER }}>
          <div className="lt-column" style={COLUMN}>
            <Alert
              className="lt-note"
              type="warning"
              showIcon
              title={t('chat.noApiKey')}
              action={<Button type="link" size="small" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>}
            />
          </div>
        </div>
      )}

      {/* Messages */}
      {/* One hairline closes the transcript — without it a long conversation
          scrolls up to touch the action row with no boundary. */}
      <div ref={setScrollEl} style={{ flex: 1, overflowY: 'auto', padding: '24px clamp(16px, 5vw, 96px)', borderBottom: '1px solid var(--lt-rule-faint)' }}>
        <div ref={contentRef} className="lt-column" style={COLUMN}>
          {conversation.characters.length === 0 && conversation.messages.length === 0 && !pendingTopic && !isSummoning && !summonError && conversation.title && (
            <Space orientation="vertical" align="center" size="large" style={{ width: '100%', padding: '64px 0' }}>
              <Title level={3} className="display-serif-italic" style={{ margin: 0, textAlign: 'center', maxWidth: 480 }}>
                "{conversation.title}"
              </Title>
              <Spin />
              <Text type="secondary">{t('home.suggesting')}</Text>
            </Space>
          )}
          {conversation.messages.length === 0 && (firstChar && !isMulti || (isMulti && roundtableTopics.length > 0)) && (() => {
            const rawQuestions = !isMulti && firstChar
              ? t(`characters.${firstChar.id}.questions`, { returnObjects: true })
              : roundtableTopics;
            // returnObjects can yield the key string if the bundle is missing the
            // key — guard so .map() below can't throw (matches the sibling paths above).
            const questions = Array.isArray(rawQuestions) ? (rawQuestions as string[]) : [];
            return (
              <div style={{ padding: '40px 0' }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  {t('chat.noMessages')}
                </Text>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 12,
                  }}
                >
                  {questions.map((q) => (
                    <Card
                      key={q}
                      size="small"
                      hoverable
                      onClick={() => handleSend(q)}
                      styles={{ body: { padding: '14px 16px' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <span
                          aria-hidden
                          className="display-serif-italic"
                          style={{
                            fontSize: 28,
                            lineHeight: 0.7,
                            color: 'var(--ant-color-primary)',
                            flexShrink: 0,
                            paddingTop: 8,
                          }}
                        >
                          “
                        </span>
                        <Text style={{ fontSize: 14, lineHeight: 1.55 }}>{q}</Text>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })()}
          {scrollEl && conversation.messages.length > 0 && (
            <Virtuoso
              customScrollParent={scrollEl}
              data={conversation.messages}
              computeItemKey={(_, msg) => msg.id}
              itemContent={renderMessage}
              increaseViewportBy={{ top: 240, bottom: 240 }}
            />
          )}
          {isGenerating && (
            <Space size="small" style={{ padding: '12px 0' }}>
              <Spin size="small" />
              <Text type="secondary">
                {isMulti && roundtable.currentRound
                  ? roundtable.currentSpeaker === '__moderator__'
                    ? t('roundtable.moderatorSynthesizing', { current: roundtable.currentRound, total: roundtable.totalRounds })
                    : speakerChar
                      ? t('roundtable.roundProgress', { current: roundtable.currentRound, total: roundtable.totalRounds, name: t(`characters.${speakerChar.id}.name`) })
                      : t('roundtable.roundPreparing', { current: roundtable.currentRound, total: roundtable.totalRounds })
                  : t('chat.thinking')}
              </Text>
              <Button danger size="small" onClick={stopGenerating}>{t('chat.stop')}</Button>
            </Space>
          )}
          {error && (() => {
            const s = useSettingsStore.getState();
            const isNetwork = /Failed to fetch|NetworkError|Load failed|ERR_NETWORK|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|timeout/i.test(error);
            const isCors = isNetwork && !s.corsEnabled[s.defaultProvider];
            // A 403 with the proxy off is the origin-block shape: the key is fine
            // and Test Connection passes, but the upstream WAF rejects requests
            // carrying a browser Origin. Routing through the proxy fixes it, so
            // offer the same one-click as the CORS case rather than a dead end.
            //
            // ⚠ 但 403 不止这一种。key 被吊销 / 打错、额度用尽、地区限制都回 403
            // （DeepSeek、智谱、千帆都这么答），而中转一个都救不了。只按状态码判，
            // 那几种会被套上「你的 key 没问题」的说法，真正写着原因的正文反而被
            // 丢掉，用户还会一键把这把坏 key 送去经过公共中转再 403 一次。
            // 判据取【正文里有没有可辨认的原因】：origin 拦截回的通常是一张 WAF
            // 的 HTML，正文里什么都没有 —— 这也正是状态码前缀要无条件保留的原因。
            const namesAReason = /api[\s_-]?key|token|unauthor|authenticat|credential|permission|quota|balance|insufficient|billing|expired|suspend|region|country/i.test(error);
            const isOriginBlocked = /^\[403\]/.test(error) && !namesAReason && !s.corsEnabled[s.defaultProvider];
            const isThinkingError = !isNetwork && s.thinkingLevel !== 'off' && /\b(reasoning_effort|enable_thinking|thinking)\b/i.test(error);
            const retryLast = () => { const lastUserMsg = [...conversation.messages].reverse().find((m) => m.role === 'user'); if (lastUserMsg) handleRetryFrom(lastUserMsg.id); };
            if (isCors || isOriginBlocked) return (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                title={t(isOriginBlocked ? 'chat.originBlocked' : 'chat.corsError')}
                // 原始报错【始终】显示。这一支是按形状猜的，猜错时用户至少还看得见
                // 上游到底说了什么，而不是对着一句「你的 key 没问题」走进死胡同。
                description={<span style={{ fontSize: 12, opacity: 0.75, wordBreak: 'break-word' }}>{error}</span>}
                action={
                  <Space>
                    <Button size="small" type="primary" onClick={() => { useSettingsStore.getState().setCorsEnabled(s.defaultProvider, true); retryLast(); }}>{t('chat.useCorsProxy')}</Button>
                    <Button size="small" type="link" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                  </Space>
                }
              />
            );
            if (isNetwork) return (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                title={t('chat.networkError')}
                action={<Button size="small" type="primary" onClick={retryLast}>{t('chat.retry')}</Button>}
              />
            );
            if (isThinkingError) return (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                title={t('chat.thinkingUnsupported')}
                action={
                  <Space>
                    <Button size="small" type="primary" onClick={() => { useSettingsStore.getState().setThinkingLevel('off'); retryLast(); }}>{t('chat.disableThinking')}</Button>
                    <Button size="small" type="link" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                  </Space>
                }
              />
            );
            return (
              <Alert
                type="error"
                showIcon
                style={{ marginTop: 8 }}
                title={t('common.error', { message: error })}
                action={
                  <Space>
                    <Button size="small" onClick={retryLast}>{t('chat.retry')}</Button>
                    <Button size="small" type="link" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                  </Space>
                }
              />
            );
          })()}
        </div>
      </div>

      {/* Action row + composer share the transcript's column — otherwise the
          reader writes into a full-width field under a centered document. */}
      <div style={{ padding: GUTTER }}>
      <div className="lt-column" style={COLUMN}>
      <ActionBar
        conversation={conversation}
        characters={characters}
        displayTitle={displayTitle}
        isMulti={isMulti}
        isGenerating={isGenerating}
        isSummarizing={isSummarizing}
        rounds={rounds}
        shareStatus={shareStatus}
        onContinue={() => roundtable.addRounds(conversationId, rounds)}
        onSummarize={handleSummarize}
        onShare={handleShare}
        onStopSummarize={() => summarizeAbortRef.current?.abort()}
      />
      {shareStatus === 'tooLong' && (
        <Alert
          type="warning"
          showIcon
          closable
          onClose={() => setShareStatus('idle')}
          title={`${t('chat.shareTooLong')} — ${t('chat.shareTooLongHint')}`}
          style={{ margin: '4px 0' }}
        />
      )}
      <ChatInput key={conversationId} onSend={handleSend} disabled={isGenerating || isSummarizing} />
      </div>
      </div>

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
