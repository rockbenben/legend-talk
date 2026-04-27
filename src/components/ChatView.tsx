import { useLangPath } from '../hooks/useLangPath';
import { currentLang } from '../utils/lang';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../stores/conversations';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Spin, Alert, InputNumber, Typography, Divider, Space, Card } from 'antd';
import { CopyOutlined, EditOutlined, ReloadOutlined, BranchesOutlined, ArrowRightOutlined, AimOutlined } from '@ant-design/icons';
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

const { Text, Title } = Typography;

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
  const [pendingRetryMsgId, setPendingRetryMsgId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'tooLong'>('idle');
  const summarizeAbortRef = useRef<AbortController | null>(null);
  const skipNextScrollRef = useRef(false);

  const [isSummoning, setIsSummoning] = useState(false);
  const [summonError, setSummonError] = useState<string | null>(null);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const summonRef = useRef(false);
  const summonAbortRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

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
      if (url.length > 32000) { setShareStatus('tooLong'); return; }
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
          <Space direction="vertical" align="center" size="middle" style={{ padding: 24, background: 'var(--ant-color-bg-elevated)', border: '1px solid var(--ant-color-border)', borderRadius: 'var(--ant-border-radius-lg)', maxWidth: 360 }}>
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

      {/* Title bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 20px', borderBottom: '1px solid var(--ant-color-border-secondary)' }}>
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
            style={{ flex: 1, minWidth: 0, margin: 0, fontWeight: 500, cursor: 'pointer' }}
          >
            {displayTitle}
          </Title>
        )}
        {isMulti && (
          <Space size={6} style={{ marginInlineStart: 'auto' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t('roundtable.rounds')}</Text>
            <InputNumber
              size="small"
              min={1}
              max={10}
              value={rounds}
              onChange={(v) => { if (typeof v === 'number') setRounds(Math.max(1, Math.min(10, v))); }}
              disabled={isGenerating}
              style={{ width: 64 }}
            />
          </Space>
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
        onAdd={() => setShowPicker(true)}
        onRemove={(charId) => {
          if (conversation.characters.length <= 1) return;
          updateCharacters(conversationId, conversation.characters.filter((id) => id !== charId));
        }}
      />

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px clamp(16px, 5vw, 96px)' }}>
        <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto' }}>
          {!isConfigured && (
            <Alert
              type="warning"
              showIcon
              message={t('chat.noApiKey')}
              action={<Button type="link" size="small" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>}
              style={{ marginBottom: 12 }}
            />
          )}
          {conversation.characters.length === 0 && conversation.messages.length === 0 && !pendingTopic && !isSummoning && !summonError && conversation.title && (
            <Space direction="vertical" align="center" size="large" style={{ width: '100%', padding: '64px 0' }}>
              <Title level={3} className="display-serif-italic" style={{ margin: 0, textAlign: 'center', maxWidth: 480 }}>
                "{conversation.title}"
              </Title>
              <Spin />
              <Text type="secondary">{t('home.suggesting')}</Text>
            </Space>
          )}
          {conversation.messages.length === 0 && (firstChar && !isMulti || (isMulti && roundtableTopics.length > 0)) && (() => {
            const questions = !isMulti && firstChar
              ? (t(`characters.${firstChar.id}.questions`, { returnObjects: true }) as string[])
              : roundtableTopics;
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
                      styles={{ body: { padding: 14 } }}
                    >
                      <Text style={{ fontSize: 14, lineHeight: 1.5 }}>{q}</Text>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })()}
          {conversation.messages.map((msg, idx) => {
            const msgChar = msg.characterId ? presetCharacters.find((c) => c.id === msg.characterId) : undefined;
            const prevMsg = idx > 0 ? conversation.messages[idx - 1] : null;
            const showDivider = isMulti && msg.role === 'user' && prevMsg?.role === 'character';
            if (!msg.content.trim() && isGenerating && idx === conversation.messages.length - 1) return null;

            if (msg.characterId === '__focus__') {
              const isLast = idx === conversation.messages.length - 1;
              const isEditing = editingMsgId === msg.id;
              const interactive = isLast && !isGenerating && !isSummarizing;
              return (
                <Alert
                  key={msg.id}
                  type="info"
                  icon={<AimOutlined />}
                  showIcon
                  style={{ margin: '12px 0' }}
                  message={
                    <Space direction="vertical" style={{ width: '100%' }}>
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
                                  skipNextScrollRef.current = true;
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
                                iconPosition="end"
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
              <div key={msg.id} style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 120px' } as React.CSSProperties}>
                {showDivider && (
                  <Divider plain>
                    <Text type="secondary" className="display-serif-italic" style={{ fontSize: 12 }}>
                      {t('roundtable.discussionComplete')}
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
                              skipNextScrollRef.current = true;
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
                      timestamp={msg.timestamp}
                    />
                  )}
                  {!isGenerating && !isSummarizing && editingMsgId !== msg.id && (
                    <div
                      className="group-hover:!opacity-100"
                      style={{
                        display: 'flex',
                        gap: 0,
                        opacity: 0,
                        transition: 'opacity 0.18s',
                        marginTop: 4,
                        ...(msg.role === 'user'
                          ? { justifyContent: 'flex-end' }
                          : { paddingInlineStart: 54 }),
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
                      style={{
                        marginTop: 4,
                        display: 'flex',
                        ...(msg.role === 'user'
                          ? { justifyContent: 'flex-end' }
                          : { paddingInlineStart: 54 }),
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
          })}
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
            const retryLast = () => { const lastUserMsg = [...conversation.messages].reverse().find((m) => m.role === 'user'); if (lastUserMsg) handleRetryFrom(lastUserMsg.id); };
            if (isCors) return (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                message={t('chat.corsError')}
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
                message={t('chat.networkError')}
                action={<Button size="small" type="primary" onClick={retryLast}>{t('chat.retry')}</Button>}
              />
            );
            return (
              <Alert
                type="error"
                showIcon
                style={{ marginTop: 8 }}
                message={t('common.error', { message: error })}
                action={
                  <Space>
                    <Button size="small" onClick={retryLast}>{t('chat.retry')}</Button>
                    <Button size="small" type="link" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                  </Space>
                }
              />
            );
          })()}
          <div ref={bottomRef} />
        </div>
      </div>

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
          message={`${t('chat.shareTooLong')} — ${t('chat.shareTooLongHint')}`}
          style={{ margin: '4px 16px' }}
        />
      )}
      <ChatInput key={conversationId} onSend={handleSend} disabled={isGenerating || isSummarizing} />

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
