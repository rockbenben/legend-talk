import { useLangPath } from '../hooks/useLangPath';
import { currentLang } from '../utils/lang';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConversationStore } from '../stores/conversations';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Spin, Alert, Typography, Divider, Space, Card, App } from 'antd';
import { CopyOutlined, EditOutlined, ReloadOutlined, BranchesOutlined, ArrowRightOutlined, AimOutlined } from '@ant-design/icons';
import { Virtuoso } from 'react-virtuoso';
import { STALL_TIMEOUT_MS } from '../adapters/sse';
import { getAdapter } from '../adapters/registry';
import { useChat } from '../hooks/useChat';
import { useRoundtable } from '../hooks/useRoundtable';
import { useSettingsStore } from '../stores/settings';
import { presetCharacters } from '../characters/presets';
import { getLangInstruction, isProviderConfigured, proxyWouldServe, resolveProvider, streamResponse, suggestCharacters } from '../utils/prompt';
import { compressToBase64 } from '../utils/compress';
import { COLUMN, COLUMN_PADDING, GUTTER } from '../utils/layout';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { CharacterPicker } from './CharacterPicker';
import { ParticipantsBar } from './ParticipantsBar';
import { ActionBar } from './ActionBar';
import type { Character, Message } from '../types';

const { Text, Title } = Typography;


function isAnalysisMsg(characterId?: string): boolean {
  return !!characterId?.startsWith('__') && !!characterId?.endsWith('__');
}

/**
 * Keep the model's own words readable when they are shown back to the user.
 * A model that ignored the "JSON array only" instruction can answer with a
 * paragraph — the point is to let the user SEE that, not to paste a novel
 * into the error veil.
 */
function truncateReply(reply: string, max = 240): string {
  const flat = reply.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

const ANALYSIS_META: Record<string, { emoji: string; labelKey: string }> = {
  '__summarize__': { emoji: '📋', labelKey: 'chat.summarize' },
  '__moderator__': { emoji: '⚖️', labelKey: 'moderator.name' },
};

interface ChatViewProps {
  conversationId: string;
}

export function ChatView({ conversationId }: ChatViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lp = useLangPath();
  const { message } = App.useApp();
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
  const defaultProvider = useSettingsStore((s) => s.defaultProvider);
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
  // Every scroll position WE caused, newest last. The scroll event is delivered
  // asynchronously: by the time the handler runs, the transcript may have grown
  // again, and the gap to the bottom then reads "the reader moved away" even
  // though nobody scrolled. One speech is taller than the slack threshold, so
  // a single arriving message was enough to switch follow-mode off for the
  // rest of the session — the newest message, the error alert and the focus
  // card's Start button all ended up below the fold, under the composer.
  //
  // A single "last position" is not enough: two pins can happen before the
  // first scroll event is delivered, and the event then reports the older one.
  // So keep a short history and treat any event landing on one of them as ours.
  const ownScrollTopsRef = useRef<number[]>([]);
  const rememberOwnScroll = (top: number) => {
    const own = ownScrollTopsRef.current;
    own.push(top);
    if (own.length > 8) own.splice(0, own.length - 8);
  };

  /**
   * Scroll the transcript so its REAL bottom sits at the bottom of the viewport.
   *
   * Three mechanisms, and they each fix a different part of "the newest
   * message ended up below the fold":
   *
   * 1. `ownScrollTopsRef` (above) — the scroll event is delivered
   *    asynchronously, so by the time the handler runs the transcript may have
   *    grown again; the gap to the bottom then reads "the reader moved away"
   *    although nobody scrolled. Remembering the positions WE caused tells the
   *    two apart.
   * 2. This function — `scrollHeight` can be one layout behind the rendered
   *    content, so the tail of the last message is still below the fold even
   *    after a scroll to the bottom. The list element carries the real height
   *    of the rendered items; the difference is added on top.
   * 3. The `conversation.messages.length` effect below — a new message changes
   *    the height before the ResizeObserver gets a chance to fire.
   *
   * Measured, for the record: the reader CAN always scroll the tail into view
   * by hand (the scroll range is not capped by the estimate — verified by
   * dragging the scrollbar to the bottom), so this is "the app did not follow",
   * not "the content was unreachable".
   *
   * ⚠ `data-testid="virtuoso-item-list"` is react-virtuoso's INTERNAL marker,
   * not a documented API. If a future version renames it, the correction
   * silently stops applying and the newest message falls below the fold again.
   * The element is optional here (the plain scroll still happens), so a rename
   * degrades rather than breaks — but it will not fail loudly, and jsdom has no
   * layout, so no test can catch it either. See AGENTS.md.
   */
  const scrollToBottom = useCallback(() => {
    if (!scrollEl) return;
    scrollEl.scrollTop = scrollEl.scrollHeight;
    const list = contentRef.current?.querySelector('[data-testid="virtuoso-item-list"]') as HTMLElement | null;
    if (list) {
      const overflow = list.getBoundingClientRect().bottom - scrollEl.getBoundingClientRect().bottom;
      if (overflow > 0) scrollEl.scrollTop += overflow;
    }
    rememberOwnScroll(scrollEl.scrollTop);
  }, [scrollEl]);

  useEffect(() => {
    if (!scrollEl) return;
    const onScroll = () => {
      const top = scrollEl.scrollTop;
      // One of OUR scrolls → the gap that opened up is content that arrived,
      // which is the one thing we do want to follow. Keep following.
      if (ownScrollTopsRef.current.some((v) => Math.abs(top - v) <= 1)) {
        stickToBottomRef.current = true;
        return;
      }
      // 80px of slack: "close enough to the bottom to still be reading along".
      stickToBottomRef.current =
        scrollEl.scrollHeight - top - scrollEl.clientHeight < 80;
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
    let observedList: HTMLElement | null = null;
    const pin = () => {
      // The list element is what grows when a message lands; the container
      // around it is sized by Virtuoso's own bookkeeping, so it does not always
      // change when the rendered content does. Observe the list too — otherwise
      // the tail of the newest message never triggers a re-pin and stays under
      // the fold. (Same internal marker as in scrollToBottom — see the note
      // there about it not being a public API.)
      const list = content.querySelector('[data-testid="virtuoso-item-list"]') as HTMLElement | null;
      if (list && list !== observedList) {
        if (observedList) ro.unobserve(observedList);
        observedList = list;
        ro.observe(list);
      }
      if (!stickToBottomRef.current) return;
      scrollToBottom();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!stickToBottomRef.current) return;
        scrollToBottom();
      });
    };
    const ro = new ResizeObserver(pin);
    ro.observe(content);
    // The container too, not just its content: the composer and action row
    // grow as the conversation does, and that shortens the viewport out from
    // under a transcript already pinned to the bottom.
    ro.observe(scrollEl);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [scrollEl, scrollToBottom]);

  // A new message changes the transcript's height before the ResizeObserver
  // gets a chance to fire. Pin again here so the newest message is never left
  // below the fold — the reader should not have to hunt for what just landed.
  useEffect(() => {
    if (!scrollEl || !stickToBottomRef.current) return;
    scrollToBottom();
  }, [scrollEl, conversation?.messages.length, scrollToBottom]);

  // Opening a conversation starts at the newest message.
  useEffect(() => {
    stickToBottomRef.current = true;
    if (scrollEl) {
      scrollToBottom();
      // This jump fires a scroll event too. The transcript is still short at
      // this point, so the event lands long before the list has grown — and
      // without recording it, that event reads as "the reader scrolled away
      // from the bottom" and follow-mode never starts.
    }
  }, [conversationId, scrollEl, scrollToBottom]);

  const startSummon = (topic: string) => {
    const provider = resolveProvider();
    if (!provider) { setSummonError(null); return; }

    summonAbortRef.current?.abort();
    const controller = new AbortController();
    summonAbortRef.current = controller;

    setIsSummoning(true);
    setSummonError(null);
    // The catalogue is offered to the model as English slugs, but a model that
    // answers in the conversation's language answers with display names — so
    // hand it both spellings and let the parser resolve either.
    const tEn = i18n.getFixedT('en');
    const allChars = presetCharacters.map((c) => ({
      id: c.id,
      domain: c.domain[0],
      names: [t(`characters.${c.id}.name`), tEn(`characters.${c.id}.name`)],
    }));
    suggestCharacters(topic, provider, allChars, controller.signal)
      .then((res) => {
        if (res.ids.length >= 2) {
          useConversationStore.getState().updateCharacters(conversationId, res.ids);
          setPendingTopic(null);
          roundtable.sendMessage(conversationId, topic, rounds);
        } else if (res.reason === 'no-list') {
          // The model replied, but not with a list we can read. Show what it
          // actually said — "no matching characters" would blame the topic for
          // a failure that has nothing to do with it.
          setSummonError(t('chat.summonBadReply', { reply: truncateReply(res.raw) }));
        } else if (res.ids.length === 1) {
          // The model named exactly one panelist. A roundtable needs two, and
          // seating a single voice here would silently downgrade the request
          // to a one-on-one chat — say what happened instead.
          setSummonError(t('chat.summonOnePanel', { reply: truncateReply(res.raw) }));
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
    // A template roundtable is BORN named after the template ("哲学辩论"), so the
    // topic it actually discusses never reaches the title — and two roundtables
    // from the same template are indistinguishable in the sidebar. The first
    // user message IS the topic, so it takes the title over. Same shape as a
    // topic-started conversation, which names itself after the topic.
    //
    // "Is the title still the default?" is answered against the title stored at
    // CREATION (defaultTitle), not against the template's name in the current
    // language — the UI language may have changed since the conversation was
    // opened, and comparing localized strings silently disabled the hand-over.
    // A title the user set by hand differs from defaultTitle, so it is left
    // alone.
    if (
      conversation.templateId &&
      conversation.title === conversation.defaultTitle &&
      !conversation.messages.some((m) => m.role === 'user')
    ) {
      const topic = content.trim();
      if (topic) renameConversation(conversationId, [...topic].slice(0, 29).join(''));
    }
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
      // Silence here would be a lie in the other direction: the click did
      // something and it failed. WriteText is unavailable in exactly the
      // WebViews this app targets (WeChat's in-app browser, some corporate
      // shells) — say so, and let the user copy the link by hand.
      setShareStatus('idle');
      message.error(t('chat.copyFailed'));
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
    // typeset a「第 N 轮」rule like the printed proceedings. The FIRST round
    // opens after the topic (or the focus card that absorbed it) — a chaptered
    // document numbers its opening chapter too, so the rule is not reserved
    // for round ≥ 2.
    const showRoundRule = isMulti && msg.role === 'character' && msg.characterId && !msg.characterId.startsWith('__')
      && (prevMsg?.characterId === '__moderator__' || prevMsg?.role === 'user' || prevMsg?.characterId === '__focus__');
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
              className={`group-hover:!opacity-100 group-focus-within:!opacity-100 lt-reveal${afterSpeech}`}
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
            background: 'color-mix(in srgb, var(--lt-paper) 92%, transparent)',
          }}
        >
          {/* Hairline memorandum, not a glass card: the veil carries the
              separation, so the sheet draws only its top/bottom rules. */}
          <Space orientation="vertical" align="center" size="small" style={{ padding: '24px 32px', background: 'transparent', borderBlock: '1px solid var(--lt-rule)', maxWidth: 480, textAlign: 'center' }}>
            {isSummoning ? (
              <>
                <Spin />
                <Text type="secondary">{t('home.suggesting')}</Text>
              </>
            ) : !isConfigured ? (
              <>
                <Text className="display-serif" style={{ fontSize: 18, fontWeight: 600 }}>{t('chat.summonBlocked')}</Text>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.9 }}>
                  {t('chat.summonNoKeyBody', {
                    topic: pendingTopic,
                    provider: getAdapter(defaultProvider)?.name || defaultProvider,
                  })}
                </Text>
                <Space>
                  <Button type="primary" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                  <Button onClick={() => setPendingTopic(null)}>{t('chat.later')}</Button>
                </Space>
              </>
            ) : summonError ? (
              <>
                <Text className="display-serif" style={{ fontSize: 18, fontWeight: 600 }}>{t('chat.summonBlocked')}</Text>
                <Text type="danger" style={{ fontSize: 13 }}>{summonError}</Text>
                <Space>
                  <Button type="primary" onClick={() => startSummon(pendingTopic)}>{t('chat.retry')}</Button>
                  <Button onClick={() => setPendingTopic(null)}>{t('chat.later')}</Button>
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
            level={2}
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
          can't scroll away behind the transcript. Hidden while the summon veil
          is up: the veil says the same thing with more context, and two
          "no API key" banners on one screen is one too many. */}
      {!isConfigured && !(pendingTopic && !isMulti) && (
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
      <div ref={setScrollEl} style={{ flex: 1, overflowY: 'auto', padding: COLUMN_PADDING, borderBottom: '1px solid var(--lt-rule-faint)' }}>
        <div ref={contentRef} className="lt-column" style={COLUMN}>
          {/* No panel yet. The topic is on record — say so, and give the one
              step that moves things forward. The old copy here was a spinner
              reading "Matching…", shown precisely when NOTHING was matching:
              after the summon failed and the user dismissed the veil the
              conversation sat in that state forever, looking busy and offering
              no way out. */}
          {conversation.characters.length === 0 && conversation.messages.length === 0 && !pendingTopic && conversation.title && (
            <Space orientation="vertical" align="center" size="large" style={{ width: '100%', padding: '64px 0' }}>
              <Title level={3} className="display-serif-italic" style={{ margin: 0, textAlign: 'center', maxWidth: 480 }}>
                "{conversation.title}"
              </Title>
              <Button type="primary" onClick={() => setShowPicker(true)}>
                {t('home.pickPanelists')}
              </Button>
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
          {error && (() => {
            const s = useSettingsStore.getState();
            const isNetwork = /Failed to fetch|NetworkError|Load failed|ERR_NETWORK|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|timeout/i.test(error);
            // 「开中转」这个建议只有在【中转真的能转到这家】时才成立。
            //
            // Custom（llm）根本不走中转 —— resolveProvider 里的 useCors 要求
            // !isCustom，所以给它开中转开关，请求还是照原样发出去，一个字都不会变；
            // 设置页那一栏对 Custom 压根不渲染，用户过去找也找不到那个开关。
            // 而 Custom 连的又常常是本机 / 自建服务（README 主推 Ollama、LM Studio、
            // LiteLLM），「连不上」是它最常见的死法 —— 端口没起、地址写错、http
            // 写成 https，浏览器一律回一句 Failed to fetch。把这句话说成「CORS
            // 被拦、请用中转」再附一个点了没反应的按钮，是把人引向一条死路。
            //
            // 自填地址配内置公共中转同理：proxyWouldServe 为 false（名单外 + 局域网
            // 够不着 + 可能带 ?token 的地址不该交给第三方），中转帮不上忙。
            const relayAdapter = getAdapter(s.defaultProvider);
            const relayOverride = s.baseUrlByProvider?.[s.defaultProvider]?.trim();
            const relayCanServe =
              s.defaultProvider !== 'llm' &&
              !!relayAdapter &&
              proxyWouldServe(relayAdapter, relayOverride, s.corsProxy);
            const isCors = isNetwork && !s.corsEnabled[s.defaultProvider] && relayCanServe;
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
            const isOriginBlocked = /^\[403\]/.test(error) && !namesAReason && !s.corsEnabled[s.defaultProvider] && relayCanServe;
            // 「静默超时」自成一支：连接是活的、状态码是 2xx，只是上游 180 秒
            // 一个字节都没吐（排队，或首字节前的深度推理不外发 reasoning delta）。
            // 不能落到 isNetwork 那支去劝人开中转 —— 跨域根本不是这次的死因。
            // 匹配的是 sse.ts 自己拼的串；改那句文案要连这里一起改（sse.test.ts 会红）。
            const isStalled = /^Stream stalled/.test(error);
            const isThinkingError = !isNetwork && s.thinkingLevel !== 'off' && /\b(reasoning_effort|enable_thinking|thinking)\b/i.test(error);
            const retryLast = () => { const lastUserMsg = [...conversation.messages].reverse().find((m) => m.role === 'user'); if (lastUserMsg) handleRetryFrom(lastUserMsg.id); };
            if (isStalled) return (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                title={t('chat.streamStalled', { seconds: STALL_TIMEOUT_MS / 1000 })}
                description={<span style={{ fontSize: 12, color: 'var(--lt-ink-soft)', wordBreak: 'break-word' }}>{error}</span>}
                action={
                  <Space>
                    {s.thinkingLevel !== 'off' && (
                      <Button size="small" type="primary" onClick={() => { useSettingsStore.getState().setThinkingLevel('off'); retryLast(); }}>{t('chat.disableThinking')}</Button>
                    )}
                    <Button size="small" onClick={retryLast}>{t('chat.retry')}</Button>
                  </Space>
                }
              />
            );
            if (isCors || isOriginBlocked) return (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
                title={t(isOriginBlocked ? 'chat.originBlocked' : 'chat.corsError')}
                // 原始报错【始终】显示。这一支是按形状猜的，猜错时用户至少还看得见
                // 上游到底说了什么，而不是对着一句「你的 key 没问题」走进死胡同。
                description={<span style={{ fontSize: 12, color: 'var(--lt-ink-soft)', wordBreak: 'break-word' }}>{error}</span>}
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
                description={<span style={{ fontSize: 12, color: 'var(--lt-ink-soft)', wordBreak: 'break-word' }}>{error}</span>}
                action={
                  <Space>
                    <Button size="small" type="primary" onClick={retryLast}>{t('chat.retry')}</Button>
                    {/* 中转帮不上忙的时候，解药在设置里（自定义地址 / 服务商 / key），
                        没有这一条用户就只剩一个「重试」，对着同一个死路重试。 */}
                    {!relayCanServe && (
                      <Button size="small" type="link" onClick={() => navigate(lp('/settings'))}>{t('chat.goSettings')}</Button>
                    )}
                  </Space>
                }
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
      {/* Status + Stop sit BELOW the scroll container, not after the Virtuoso
          list inside it: with customScrollParent the list root carries an
          explicit height that lags the streaming message's growth by a frame,
          so a flow sibling gets painted over the text still being written.
          Down here it also stays reachable without scrolling — and ActionBar
          renders null while generating, so it costs no extra row. */}
      {isGenerating && (
        <Space size="small" style={{ padding: '8px 0 0' }}>
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
      <ChatInput
        key={conversationId}
        onSend={handleSend}
        // Nobody at the table = nobody to talk to. Leaving the composer live
        // there let the user type into a trap: the send failed with a generic
        // "something went wrong" because there was no character to answer.
        disabled={isGenerating || isSummarizing || conversation.characters.length === 0}
        placeholder={
          conversation.characters.length === 0
            ? t('chat.pickPanelistsFirst')
            : !isMulti && firstChar
              // One-on-one: name the thinker. "Adjust the discussion focus" is a
              // roundtable affordance — a single voice has no focus to steer.
              ? t('chat.inputPlaceholderSingle', { name: t(`characters.${firstChar.id}.name`) })
              : isMulti && conversation.messages.length === 0
                // A roundtable that has not started yet has no focus to steer
                // either — the focus card only exists from the first directive
                // on. Offer the first question instead.
                ? t('chat.inputPlaceholderFirst')
                : t('chat.inputPlaceholder')
        }
      />
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
