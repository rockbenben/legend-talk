import { useState, useRef } from 'react';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { buildSystemPrompt, resolveProvider, streamResponse, ROUNDTABLE_SUFFIX, MODERATOR_SYSTEM_PROMPT } from '../utils/prompt';
import i18n from '../i18n';

const MODERATOR_ID = '__moderator__';
const FOCUS_ID = '__focus__';

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

    // Director intervention: multi-char conversation that already has at least one user
    // message. The new message is a course correction from the chair — don't auto-run
    // rounds; surface the distilled focus so the chair can edit it and start manually.
    const isDirective = conversation.characters.length > 1 &&
                        conversation.messages.some((m) => m.role === 'user');

    const controller = new AbortController();
    startGen(conversationId, controller, rounds);

    try {
      if (isDirective) {
        // Compute the snapshot — the focus state that exists right now, which this
        // intervention is overlaying. The snapshot is attached to the new user message
        // so a future retry can rebuild focus faithfully (snapshot + edited content),
        // preserving the chair's focus edits made before this intervention.
        const store = useConversationStore.getState();
        let snapshot = '';
        const before = store.getConversation(conversationId)!;
        for (let i = before.messages.length - 1; i >= 0; i--) {
          const m = before.messages[i];
          if (m.characterId === FOCUS_ID && m.content.trim()) { snapshot = m.content.trim(); break; }
        }
        if (!snapshot) {
          // No focus card present (first intervention, or a retry cleared the chain).
          // Reconstruct from surviving user messages.
          const priorUserMsgs = before.messages
            .filter((m) => m.role === 'user' && m.content.trim())
            .map((m) => m.content.trim());
          snapshot = priorUserMsgs.join('\n\n');
        }

        store.addMessage(conversationId, 'user', content, undefined, snapshot);

        const focusText = snapshot ? `${snapshot}\n\n${content}` : content;
        store.removeMessagesByCharacterId(conversationId, FOCUS_ID);
        store.addMessage(conversationId, 'character', focusText, FOCUS_ID);
        return; // Chair will confirm or edit, then call startFromFocus
      }

      // Non-directive path: the first user message (initial topic)
      useConversationStore.getState().addMessage(conversationId, 'user', content, undefined);

      updateConv(conversationId, { round: 1 });
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

  /**
   * Retry a chair intervention message, preserving the focus snapshot captured when
   * the message was originally sent. Removes messages AFTER the intervention (keeps
   * the user message itself), then rebuilds the focus card as `snapshot + content`.
   * The chair clicks Start to run rounds on the rebuilt focus.
   */
  function retryFromIntervention(conversationId: string, messageId: string) {
    const store = useConversationStore.getState();
    const conv = store.getConversation(conversationId);
    if (!conv) return;
    const msg = conv.messages.find((m) => m.id === messageId);
    if (!msg || msg.role !== 'user' || msg.focusSnapshot === undefined) return;

    store.removeMessagesAfter(conversationId, messageId);
    const focusText = msg.focusSnapshot
      ? `${msg.focusSnapshot}\n\n${msg.content}`
      : msg.content;
    store.removeMessagesByCharacterId(conversationId, FOCUS_ID);
    store.addMessage(conversationId, 'character', focusText, FOCUS_ID);
  }

  /**
   * Run rounds using the user-confirmed topic from the last focus card. Triggered by
   * the chair clicking Start on the focus card after (optionally) editing it.
   */
  async function startFromFocus(conversationId: string, rounds: number) {
    const provider = resolveProvider();
    if (!provider) { updateConv(conversationId, { error: i18n.t('chat.noApiKey') }); return; }

    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv) return;

    let focusIdx = -1;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].characterId === FOCUS_ID) { focusIdx = i; break; }
    }
    if (focusIdx < 0) return;
    const topic = conv.messages[focusIdx].content.trim();
    if (!topic) return;

    const controller = new AbortController();
    startGen(conversationId, controller, rounds);
    updateConv(conversationId, { round: 1 });

    try {
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
    updateConv(conversationId, { round: 1, speaker: MODERATOR_ID });

    try {
      // Skip topic resolution for retry — topic hasn't changed, buildModeratorMessages
      // falls back to the first user message which is sufficient for re-synthesis
      const modMessages = buildModeratorMessages(conversationId, provider.lang);
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
    sendMessage, continueFrom, addRounds, retryModerator, startFromFocus, retryFromIntervention, stop,
    isGenerating: generatingIds.has(activeConversationId),
    currentSpeaker: state.speaker,
    currentRound: state.round,
    totalRounds: state.totalRounds,
    error: state.error,
  };
}

// ── Topic resolution ──────────────────────────────────────────────────

/**
 * Topic = content of the latest non-empty focus card (which the chair may have edited).
 * When no focus card exists, returns undefined; buildRoundtableMessages then falls back
 * to the first user message as the topic anchor.
 */
async function resolveRoundtableTopic(
  conversationId: string,
  _provider: NonNullable<ReturnType<typeof resolveProvider>>,
  _signal?: AbortSignal,
): Promise<string | undefined> {
  const conv = useConversationStore.getState().getConversation(conversationId)!;
  if (conv.characters.length <= 1) return undefined;
  for (let i = conv.messages.length - 1; i >= 0; i--) {
    if (conv.messages[i].characterId === FOCUS_ID) {
      const content = conv.messages[i].content.trim();
      return content || undefined;
    }
  }
  return undefined;
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
 * Topic injection: the current topic (focus card content if any, otherwise the first
 * user message) is injected as a single user turn right after the system prompt. All
 * raw user messages in the conversation are skipped — they are either the topic itself
 * (msg1) or have already been absorbed into the focus card (msg2, msg3, ...), so
 * including them would double-count in the LLM context.
 *
 * Compression (when moderator syntheses exist):
 *   - Older rounds' other-character messages are dropped (absorbed by moderator syntheses)
 *   - Own older messages kept for stance continuity
 *   - Previous round + current round kept in full
 *   - All moderator syntheses kept (discussion evolution)
 */
function buildRoundtableMessages(
  character: { id: string; systemPrompt: string },
  conversationId: string,
  lang: string,
  topic?: string,
): RawMsg[] {
  const conversation = useConversationStore.getState().getConversation(conversationId)!;
  const isMulti = conversation.characters.length > 1;
  const messages = conversation.messages.filter((m) => m.content.trim());

  // Locate moderator syntheses, focus card, and the first user message
  const modIdxs: number[] = [];
  let focusIdx = -1;
  let firstUserIdx = -1;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].characterId === MODERATOR_ID) modIdxs.push(i);
    if (messages[i].characterId === FOCUS_ID) focusIdx = i;
    if (messages[i].role === 'user' && firstUserIdx < 0) firstUserIdx = i;
  }
  const lastModIdx = modIdxs.length > 0 ? modIdxs[modIdxs.length - 1] : -1;
  const prevModIdx = modIdxs.length > 1 ? modIdxs[modIdxs.length - 2] : -1;
  const hasPrior = isMulti && lastModIdx >= 0;
  // Fresh directive: a focus card exists and has been created/edited since the last
  // moderator synthesis (i.e., the chair has adjusted the topic and no round has yet
  // absorbed the change).
  const hasFreshDirective = isMulti && focusIdx > lastModIdx;

  const resolvedTopic =
    (topic && topic.trim()) ||
    (focusIdx >= 0 ? messages[focusIdx].content.trim() : '') ||
    (firstUserIdx >= 0 ? messages[firstUserIdx].content.trim() : '');

  let suffix = '';
  if (isMulti) {
    suffix = ROUNDTABLE_SUFFIX;
    if (resolvedTopic) {
      suffix += `\n\nThe question on the table: "${resolvedTopic}". Every paragraph you write must advance your own answer to this question, not your position relative to other speakers.`;
    }
    if (hasFreshDirective && resolvedTopic) {
      suffix += `\n\nThe chair (the user who convened this roundtable) has just updated the focus. The current focus (shown above) reflects their latest direction. Apply it in your next turn while keeping the useful depth prior rounds have already built on this topic.`;
    }
  }

  const systemPrompt = buildSystemPrompt(character.systemPrompt, lang, suffix);
  const raw: RawMsg[] = [{ role: 'system', content: systemPrompt }];

  // Inject the topic as the opening user turn. This is the sole source of the chair's
  // voice in context — raw user messages are skipped below.
  if (resolvedTopic) {
    raw.push({ role: 'user', content: resolvedTopic });
  }

  const modName = i18n.t('moderator.name');

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // All user messages skipped — topic is already injected above.
    if (msg.role === 'user') continue;

    if (msg.characterId === MODERATOR_ID) {
      raw.push({ role: 'user', content: `[${modName}]: ${msg.content}` });
      continue;
    }

    if (!msg.characterId || msg.characterId.startsWith('__')) continue;

    // Character message — decide keep/drop based on compression window
    const isOwn = msg.characterId === character.id;
    const inRecentWindow = !hasPrior || i > prevModIdx; // previous round or current round (or full history)

    if (inRecentWindow) {
      if (isOwn) {
        raw.push({ role: 'assistant', content: msg.content });
      } else {
        const name = i18n.t(`characters.${msg.characterId}.name`);
        raw.push({ role: 'user', content: `[${name}]: ${msg.content}` });
      }
    } else if (isOwn) {
      // Older rounds: preserve only own messages for stance continuity
      raw.push({ role: 'assistant', content: msg.content });
    }
  }

  return mergeConsecutive(raw);
}

/**
 * Build messages for the moderator.
 *
 * Context: topic (focus card if any, else msg1) + own prior syntheses + current round
 * character messages. Raw user messages are skipped for the same reason as the character
 * builder: the topic carries the chair's voice already.
 */
function buildModeratorMessages(
  conversationId: string,
  lang: string,
  topic?: string,
): RawMsg[] {
  const conversation = useConversationStore.getState().getConversation(conversationId)!;
  const messages = conversation.messages.filter((m) => m.content.trim());

  let lastModIdx = -1;
  let focusIdx = -1;
  let firstUserIdx = -1;
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].characterId === MODERATOR_ID) lastModIdx = i;
    if (messages[i].characterId === FOCUS_ID) focusIdx = i;
    if (messages[i].role === 'user' && firstUserIdx < 0) firstUserIdx = i;
  }
  const hasFreshDirective = focusIdx > lastModIdx;

  const resolvedTopic =
    (topic && topic.trim()) ||
    (focusIdx >= 0 ? messages[focusIdx].content.trim() : '') ||
    (firstUserIdx >= 0 ? messages[firstUserIdx].content.trim() : '');

  let modSuffix = '';
  if (resolvedTopic) {
    modSuffix = ` The discussion topic is: "${resolvedTopic}".`;
  }
  if (hasFreshDirective && resolvedTopic) {
    modSuffix += `\n\nThe chair (the user who convened this roundtable) has just updated the focus. The current focus (shown above) reflects their latest direction. Open your synthesis by briefly naming what the chair is redirecting toward and which depth from prior rounds carries forward. Orient your "unexplored angle" and "open question" around this current focus.`;
  }
  const systemPrompt = buildSystemPrompt(MODERATOR_SYSTEM_PROMPT, lang, modSuffix);
  const raw: RawMsg[] = [{ role: 'system', content: systemPrompt }];

  // Inject topic as the opening user turn (sole source of the chair's voice)
  if (resolvedTopic) {
    raw.push({ role: 'user', content: resolvedTopic });
  }

  // Own prior syntheses — assistant role tracks own evolution
  for (const msg of messages) {
    if (msg.characterId === MODERATOR_ID) {
      raw.push({ role: 'assistant', content: msg.content });
    }
  }

  // Current round character messages (after last moderator, or all if first round)
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
