import { useState, useRef } from 'react';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { buildSystemPrompt, resolveProvider, streamResponse } from '../utils/prompt';
import i18n from '../i18n';

export function useChat(activeConversationId: string) {
  const abortMap = useRef(new Map<string, AbortController>());
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [errorMap, setErrorMap] = useState<Map<string, string>>(new Map());

  function buildMessages(conversationId: string, characterPrompt: string, lang: string) {
    const conv = useConversationStore.getState().getConversation(conversationId)!;
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildSystemPrompt(characterPrompt, lang) },
    ];
    for (const msg of conv.messages) {
      if (msg.role === 'character' && (!msg.characterId || msg.characterId.startsWith('__'))) continue; // skip analysis messages
      if (!msg.content.trim()) continue; // skip empty messages
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    }
    return messages;
  }

  async function generate(conversationId: string, addUserMessage?: string) {
    const conversation = useConversationStore.getState().getConversation(conversationId);
    if (!conversation) return;

    // Persist the user message before the failure-prone checks below. The error
    // Alert's Retry removes the message and re-sends, relying on this re-add —
    // erroring out before the add would make Retry destroy typed content.
    if (addUserMessage) {
      useConversationStore.getState().addMessage(conversationId, 'user', addUserMessage, undefined);
    }

    const characterId = conversation.characters[0];
    const character = presetCharacters.find((c) => c.id === characterId);
    if (!character) {
      // Character no longer exists (e.g. a deleted custom character) — surface an
      // error instead of silently swallowing the user's message.
      setErrorMap(prev => new Map(prev).set(conversationId, i18n.t('common.somethingWrong')));
      return;
    }

    const provider = resolveProvider();
    if (!provider) {
      setErrorMap(prev => new Map(prev).set(conversationId, i18n.t('chat.noApiKey')));
      return;
    }

    const controller = new AbortController();
    abortMap.current.set(conversationId, controller);
    setGeneratingIds(prev => new Set(prev).add(conversationId));
    setErrorMap(prev => { const next = new Map(prev); next.delete(conversationId); return next; });

    try {
      const messages = buildMessages(conversationId, character.systemPrompt, provider.lang);
      await streamResponse(conversationId, characterId, messages, provider, controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setErrorMap(prev => new Map(prev).set(conversationId, err instanceof Error ? err.message : i18n.t('common.error', { message: '' })));
    } finally {
      abortMap.current.delete(conversationId);
      setGeneratingIds(prev => { const next = new Set(prev); next.delete(conversationId); return next; });
    }
  }

  function stop() {
    abortMap.current.get(activeConversationId)?.abort();
  }

  return {
    sendMessage: (conversationId: string, content: string) => generate(conversationId, content),
    regenerate: (conversationId: string) => generate(conversationId),
    stop,
    isGenerating: generatingIds.has(activeConversationId),
    error: errorMap.get(activeConversationId) ?? null,
  };
}
