import { useState, useRef } from 'react';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { buildSystemPrompt, resolveProvider, streamResponse, distillTopic, ROUNDTABLE_SUFFIX, MODERATOR_SYSTEM_PROMPT } from '../utils/prompt';
import i18n from '../i18n';

const MODERATOR_ID = '__moderator__';

interface ConvState {
  speaker: string | null;
  round: number | null;
  totalRounds: number;
  error: string | null;
}

const defaultState: ConvState = { speaker: null, round: null, totalRounds: 0, error: null };

export function useRoundtable(activeConversationId: string) {
  const abortMap = useRef(new Map<string, AbortController>());
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [stateMap, setStateMap] = useState(new Map<string, ConvState>());

  function updateConv(convId: string, updates: Partial<ConvState>) {
    setStateMap(prev => {
      const next = new Map(prev);
      next.set(convId, { ...(next.get(convId) ?? defaultState), ...updates });
      return next;
    });
  }

  function startGen(conversationId: string, controller: AbortController, totalRounds: number) {
    abortMap.current.set(conversationId, controller);
    setGeneratingIds(prev => new Set(prev).add(conversationId));
    updateConv(conversationId, { error: null, totalRounds });
  }

  function finishGen(conversationId: string) {
    abortMap.current.delete(conversationId);
    setGeneratingIds(prev => { const next = new Set(prev); next.delete(conversationId); return next; });
    updateConv(conversationId, { speaker: null, round: null });
  }

  function stop() {
    abortMap.current.get(activeConversationId)?.abort();
  }

  /** Run characters + moderator for one round */
  async function runRound(
    conversationId: string,
    provider: NonNullable<ReturnType<typeof resolveProvider>>,
    signal: AbortSignal,
    topic: string | undefined,
    charIds?: string[],
  ) {
    const conv = useConversationStore.getState().getConversation(conversationId)!;
    // Shuffle speaking order each round to vary who sets the frame (skip for partial rounds and ≤2 chars)
    const baseChars = charIds || conv.characters;
    const chars = !charIds && baseChars.length > 2 ? fisherYatesShuffle([...baseChars]) : baseChars;

    for (const charId of chars) {
      updateConv(conversationId, { speaker: charId });
      const character = presetCharacters.find((c) => c.id === charId);
      if (!character) continue;
      const messages = buildRoundtableMessages(character, conversationId, provider.lang, topic);
      await streamResponse(conversationId, charId, messages, provider, signal);
    }

    if (conv.characters.length > 1) {
      updateConv(conversationId, { speaker: MODERATOR_ID });
      const modMessages = buildModeratorMessages(conversationId, provider.lang, topic);
      await streamResponse(conversationId, MODERATOR_ID, modMessages, provider, signal);
    }
  }

  async function sendMessage(conversationId: string, content: string, rounds: number = 3) {
    const provider = resolveProvider();
    if (!provider) { updateConv(conversationId, { error: i18n.t('chat.noApiKey') }); return; }

    const conversation = useConversationStore.getState().getConversation(conversationId);
    if (!conversation) return;

    const controller = new AbortController();
    startGen(conversationId, controller, rounds);
    updateConv(conversationId, { round: 1 });

    useConversationStore.getState().addMessage(conversationId, 'user', content, undefined);

    try {
      const topic = await resolveRoundtableTopic(conversationId, provider, controller.signal);

      for (let round = 1; round <= rounds; round++) {
        updateConv(conversationId, { round, speaker: null });
        await runRound(conversationId, provider, controller.signal, topic);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      updateConv(conversationId, { error: err instanceof Error ? err.message : i18n.t('common.error', { message: '' }) });
    } finally {
      finishGen(conversationId);
    }
  }

  async function continueFrom(conversationId: string, startCharId: string, rounds: number) {
    const provider = resolveProvider();
    if (!provider) { updateConv(conversationId, { error: i18n.t('chat.noApiKey') }); return; }

    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv) return;

    const chars = conv.characters;
    const startIdx = chars.indexOf(startCharId);
    if (startIdx === -1) return;

    let lastUserIdx = -1;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') { lastUserIdx = i; break; }
    }
    const charsSoFar = conv.messages.slice(lastUserIdx + 1).filter((m) => m.role === 'character' && m.characterId && !m.characterId.startsWith('__')).length;
    const completedRounds = Math.floor(charsSoFar / chars.length);
    const remainingFullRounds = Math.max(0, rounds - completedRounds - 1);

    const controller = new AbortController();
    startGen(conversationId, controller, completedRounds + 1 + remainingFullRounds);
    updateConv(conversationId, { round: completedRounds + 1 });

    try {
      const topic = await resolveRoundtableTopic(conversationId, provider, controller.signal);

      await runRound(conversationId, provider, controller.signal, topic, chars.slice(startIdx));

      for (let r = 0; r < remainingFullRounds; r++) {
        updateConv(conversationId, { round: completedRounds + 2 + r, speaker: null });
        await runRound(conversationId, provider, controller.signal, topic);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      updateConv(conversationId, { error: err instanceof Error ? err.message : i18n.t('common.error', { message: '' }) });
    } finally {
      finishGen(conversationId);
    }
  }

  async function addRounds(conversationId: string, count: number) {
    const provider = resolveProvider();
    if (!provider) { updateConv(conversationId, { error: i18n.t('chat.noApiKey') }); return; }

    const controller = new AbortController();
    startGen(conversationId, controller, count);
    updateConv(conversationId, { round: 1 });

    try {
      const topic = await resolveRoundtableTopic(conversationId, provider, controller.signal);

      for (let round = 1; round <= count; round++) {
        updateConv(conversationId, { round, speaker: null });
        await runRound(conversationId, provider, controller.signal, topic);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      updateConv(conversationId, { error: err instanceof Error ? err.message : i18n.t('common.error', { message: '' }) });
    } finally {
      finishGen(conversationId);
    }
  }

  async function retryModerator(conversationId: string) {
    const provider = resolveProvider();
    if (!provider) { updateConv(conversationId, { error: i18n.t('chat.noApiKey') }); return; }

    const controller = new AbortController();
    startGen(conversationId, controller, 1);
    updateConv(conversationId, { round: 1 });

    try {
      const topic = await resolveRoundtableTopic(conversationId, provider, controller.signal);
      updateConv(conversationId, { speaker: MODERATOR_ID });
      const modMessages = buildModeratorMessages(conversationId, provider.lang, topic);
      await streamResponse(conversationId, MODERATOR_ID, modMessages, provider, controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      updateConv(conversationId, { error: err instanceof Error ? err.message : i18n.t('common.error', { message: '' }) });
    } finally {
      finishGen(conversationId);
    }
  }

  const state = stateMap.get(activeConversationId) ?? defaultState;
  return {
    sendMessage, continueFrom, addRounds, retryModerator, stop,
    isGenerating: generatingIds.has(activeConversationId),
    currentSpeaker: state.speaker,
    currentRound: state.round,
    totalRounds: state.totalRounds,
    error: state.error,
  };
}

// ── Topic resolution ──────────────────────────────────────────────────

const topicCache = new Map<string, { userMsgCount: number; lang: string; topic: string }>();

async function resolveRoundtableTopic(
  conversationId: string,
  provider: NonNullable<ReturnType<typeof resolveProvider>>,
  signal?: AbortSignal,
): Promise<string | undefined> {
  const conv = useConversationStore.getState().getConversation(conversationId)!;
  if (conv.characters.length <= 1) return undefined;
  const userMsgs = conv.messages.filter((m) => m.role === 'user').map((m) => m.content);
  if (userMsgs.length <= 1) return undefined;

  const cached = topicCache.get(conversationId);
  if (cached && cached.userMsgCount === userMsgs.length && cached.lang === provider.lang) return cached.topic;

  try {
    const topic = await distillTopic(userMsgs, provider, signal);
    topicCache.set(conversationId, { userMsgCount: userMsgs.length, lang: provider.lang, topic });
    return topic;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return cached?.topic;
  }
}

// ── Message builders ──────────────────────────────────────────────────

type RawMsg = { role: 'system' | 'user' | 'assistant'; content: string };

function mergeConsecutive(raw: RawMsg[]): RawMsg[] {
  const merged: RawMsg[] = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const last = merged[merged.length - 1];
    if (raw[i].role === last.role) {
      last.content += '\n\n' + raw[i].content;
    } else {
      merged.push({ ...raw[i] });
    }
  }
  return merged;
}

/**
 * Build messages for a character.
 *
 * Context strategy (when moderator syntheses exist):
 *   user questions → older syntheses → own older messages → full previous round → last synthesis → current round
 *   - All moderator syntheses: discussion evolution across rounds (~500 chars each, cheap)
 *   - Own older messages: stance continuity so character doesn't contradict itself
 *   - Full previous round: direct engagement with others' specific arguments
 * Otherwise (round 1 or single char): full history
 */
function buildRoundtableMessages(
  character: { id: string; systemPrompt: string },
  conversationId: string,
  lang: string,
  topic?: string,
): RawMsg[] {
  const conversation = useConversationStore.getState().getConversation(conversationId)!;
  const isMulti = conversation.characters.length > 1;
  let suffix = '';
  if (isMulti) {
    suffix = ROUNDTABLE_SUFFIX;
    const displayTopic = topic || conversation.messages.find((m) => m.role === 'user')?.content;
    if (displayTopic) {
      suffix += ` The discussion topic is: "${displayTopic}". Always relate your arguments back to this topic.`;
    }
  }
  const systemPrompt = buildSystemPrompt(character.systemPrompt, lang, suffix);
  const raw: RawMsg[] = [{ role: 'system', content: systemPrompt }];
  const messages = conversation.messages;

  // Find last moderator synthesis for context compression
  let lastModIdx = -1;
  if (isMulti) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].characterId === MODERATOR_ID) { lastModIdx = i; break; }
    }
  }

  if (lastModIdx >= 0) {
    // Compressed context: user + older syntheses + own history + previous round + last synthesis + current round
    for (const msg of messages) {
      if (msg.role === 'user') raw.push({ role: 'user', content: msg.content });
    }

    const modName = i18n.t('moderator.name');
    let prevModIdx = -1;
    for (let i = lastModIdx - 1; i >= 0; i--) {
      if (messages[i].characterId === MODERATOR_ID) { prevModIdx = i; break; }
    }

    // All older moderator syntheses (preserves discussion evolution across rounds)
    for (let i = 0; i <= (prevModIdx >= 0 ? prevModIdx : -1); i++) {
      if (messages[i].characterId === MODERATOR_ID) {
        raw.push({ role: 'user', content: `[${modName}]: ${messages[i].content}` });
      }
    }

    // Own messages from older rounds (stance continuity)
    const prevRoundStart = prevModIdx >= 0 ? prevModIdx + 1 : 0;
    for (let i = 0; i < prevRoundStart; i++) {
      if (messages[i].characterId === character.id) {
        raw.push({ role: 'assistant', content: messages[i].content });
      }
    }

    // Full previous round (between prev moderator and last moderator)
    for (let i = prevRoundStart; i < lastModIdx; i++) {
      const msg = messages[i];
      if (msg.role === 'user') continue;
      if (!msg.characterId || msg.characterId.startsWith('__')) continue;
      if (msg.characterId === character.id) {
        raw.push({ role: 'assistant', content: msg.content });
      } else {
        const name = i18n.t(`characters.${msg.characterId}.name`);
        raw.push({ role: 'user', content: `[${name}]: ${msg.content}` });
      }
    }

    // Last moderator synthesis
    raw.push({ role: 'user', content: `[${modName}]: ${messages[lastModIdx].content}` });

    // Current round messages after last moderator
    for (let i = lastModIdx + 1; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.role === 'user') continue;
      if (!msg.characterId || msg.characterId.startsWith('__')) continue;
      if (msg.characterId === character.id) {
        raw.push({ role: 'assistant', content: msg.content });
      } else {
        const name = i18n.t(`characters.${msg.characterId}.name`);
        raw.push({ role: 'user', content: `[${name}]: ${msg.content}` });
      }
    }
  } else {
    // Full history (round 1 or moderator absent)
    for (const msg of messages) {
      if (msg.role === 'user') {
        raw.push({ role: 'user', content: msg.content });
      } else if (!msg.characterId || msg.characterId.startsWith('__')) {
        continue;
      } else if (msg.characterId === character.id) {
        raw.push({ role: 'assistant', content: msg.content });
      } else {
        const name = i18n.t(`characters.${msg.characterId}.name`);
        raw.push({ role: 'user', content: `[${name}]: ${msg.content}` });
      }
    }
  }

  return mergeConsecutive(raw);
}

/**
 * Build messages for the moderator.
 *
 * Context: user questions + all own prior syntheses + current round messages.
 */
function buildModeratorMessages(
  conversationId: string,
  lang: string,
  topic?: string,
): RawMsg[] {
  const conversation = useConversationStore.getState().getConversation(conversationId)!;
  let modSuffix = '';
  const displayTopic = topic || conversation.messages.find((m) => m.role === 'user')?.content;
  if (displayTopic) {
    modSuffix = ` The discussion topic is: "${displayTopic}".`;
  }
  const systemPrompt = buildSystemPrompt(MODERATOR_SYSTEM_PROMPT, lang, modSuffix);
  const raw: RawMsg[] = [{ role: 'system', content: systemPrompt }];
  const messages = conversation.messages;

  // Find last moderator synthesis
  let lastModIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].characterId === MODERATOR_ID) { lastModIdx = i; break; }
  }

  // User messages
  for (const msg of messages) {
    if (msg.role === 'user') raw.push({ role: 'user', content: msg.content });
  }

  // All own prior syntheses (tracks discussion evolution, avoids repeating analysis)
  for (const msg of messages) {
    if (msg.characterId === MODERATOR_ID) {
      raw.push({ role: 'assistant', content: msg.content });
    }
  }

  // Current round messages (after last moderator, or all if first round)
  const roundStart = lastModIdx >= 0 ? lastModIdx + 1 : 0;
  for (let i = roundStart; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.role === 'user') continue;
    if (!msg.characterId || msg.characterId.startsWith('__')) continue;
    const name = i18n.t(`characters.${msg.characterId}.name`);
    raw.push({ role: 'user', content: `[${name}]: ${msg.content}` });
  }

  return mergeConsecutive(raw);
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
