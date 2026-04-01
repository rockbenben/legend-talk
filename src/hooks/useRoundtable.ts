import { useState, useRef } from 'react';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { buildSystemPrompt, resolveProvider, streamResponse, ROUNDTABLE_SUFFIX } from '../utils/prompt';
import i18n from '../i18n';

export function useRoundtable() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [totalRounds, setTotalRounds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function stop() {
    abortRef.current?.abort();
  }

  async function sendMessage(conversationId: string, content: string, rounds: number = 3) {
    const provider = resolveProvider();
    if (!provider) { setError(i18n.t('chat.noApiKey')); return; }

    const conversation = useConversationStore.getState().getConversation(conversationId);
    if (!conversation) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setError(null);
    setTotalRounds(rounds);

    useConversationStore.getState().addMessage(conversationId, 'user', content, undefined);

    try {
      for (let round = 1; round <= rounds; round++) {
        setCurrentRound(round);
        const conv = useConversationStore.getState().getConversation(conversationId)!;

        for (const charId of conv.characters) {
          setCurrentSpeaker(charId);
          const character = presetCharacters.find((c) => c.id === charId);
          if (!character) continue;

          const messages = buildRoundtableMessages(character, conversationId, provider.lang);
          await streamResponse(conversationId, charId, messages, provider, controller.signal);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : i18n.t('common.error', { message: '' }));
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
      setCurrentSpeaker(null);
      setCurrentRound(null);
    }
  }

  async function continueFrom(conversationId: string, startCharId: string, rounds: number) {
    const provider = resolveProvider();
    if (!provider) { setError(i18n.t('chat.noApiKey')); return; }

    const conv = useConversationStore.getState().getConversation(conversationId);
    if (!conv) return;

    const chars = conv.characters;
    const startIdx = chars.indexOf(startCharId);
    if (startIdx === -1) return;

    let lastUserIdx = -1;
    for (let i = conv.messages.length - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') { lastUserIdx = i; break; }
    }
    const charsSoFar = conv.messages.slice(lastUserIdx + 1).filter((m) => m.role === 'character' && m.characterId).length;
    const completedRounds = Math.floor(charsSoFar / chars.length);
    const remainingFullRounds = Math.max(0, rounds - completedRounds - 1);

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setError(null);
    setTotalRounds(completedRounds + 1 + remainingFullRounds);

    try {
      setCurrentRound(completedRounds + 1);
      for (let i = startIdx; i < chars.length; i++) {
        setCurrentSpeaker(chars[i]);
        const character = presetCharacters.find((c) => c.id === chars[i]);
        if (!character) continue;
        const messages = buildRoundtableMessages(character, conversationId, provider.lang);
        await streamResponse(conversationId, chars[i], messages, provider, controller.signal);
      }

      for (let r = 0; r < remainingFullRounds; r++) {
        setCurrentRound(completedRounds + 2 + r);
        const currentConv = useConversationStore.getState().getConversation(conversationId)!;
        for (const charId of currentConv.characters) {
          setCurrentSpeaker(charId);
          const character = presetCharacters.find((c) => c.id === charId);
          if (!character) continue;
          const messages = buildRoundtableMessages(character, conversationId, provider.lang);
          await streamResponse(conversationId, charId, messages, provider, controller.signal);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : i18n.t('common.error', { message: '' }));
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
      setCurrentSpeaker(null);
      setCurrentRound(null);
    }
  }

  async function addRounds(conversationId: string, count: number) {
    const provider = resolveProvider();
    if (!provider) { setError(i18n.t('chat.noApiKey')); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setError(null);
    setTotalRounds(count);

    try {
      for (let round = 1; round <= count; round++) {
        setCurrentRound(round);
        const conv = useConversationStore.getState().getConversation(conversationId)!;
        for (const charId of conv.characters) {
          setCurrentSpeaker(charId);
          const character = presetCharacters.find((c) => c.id === charId);
          if (!character) continue;
          const messages = buildRoundtableMessages(character, conversationId, provider.lang);
          await streamResponse(conversationId, charId, messages, provider, controller.signal);
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : i18n.t('common.error', { message: '' }));
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
      setCurrentSpeaker(null);
      setCurrentRound(null);
    }
  }

  return { sendMessage, continueFrom, addRounds, stop, isGenerating, currentSpeaker, currentRound, totalRounds, error };
}

function buildRoundtableMessages(
  character: { id: string; systemPrompt: string },
  conversationId: string,
  lang: string,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const conversation = useConversationStore.getState().getConversation(conversationId)!;
  const isMulti = conversation.characters.length > 1;
  const systemPrompt = buildSystemPrompt(character.systemPrompt, lang, isMulti ? ROUNDTABLE_SUFFIX : '');

  const raw: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of conversation.messages) {
    if (msg.role === 'user') {
      raw.push({ role: 'user', content: msg.content });
    } else if (!msg.characterId) {
      // Skip summary messages (no characterId) — they shouldn't be in roundtable context
      continue;
    } else if (msg.characterId === character.id) {
      raw.push({ role: 'assistant', content: msg.content });
    } else {
      const name = i18n.t(`characters.${msg.characterId}.name`);
      raw.push({ role: 'user', content: `[${name}]: ${msg.content}` });
    }
  }

  const merged: typeof raw = [raw[0]];
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
