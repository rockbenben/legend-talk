import { useState, useRef } from 'react';
import { useConversationStore } from '../stores/conversations';
import { presetCharacters } from '../characters/presets';
import { buildSystemPrompt, resolveProvider, streamResponse } from '../utils/prompt';
import i18n from '../i18n';

export function useChat() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  function buildMessages(conversationId: string, characterPrompt: string, lang: string) {
    const conv = useConversationStore.getState().getConversation(conversationId)!;
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: buildSystemPrompt(characterPrompt, lang) },
    ];
    for (const msg of conv.messages) {
      if (msg.role === 'character' && (!msg.characterId || msg.characterId.startsWith('__'))) continue; // skip analysis messages
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    }
    return messages;
  }

  async function generate(conversationId: string, addUserMessage?: string) {
    const conversation = useConversationStore.getState().getConversation(conversationId);
    if (!conversation) return;

    const characterId = conversation.characters[0];
    const character = presetCharacters.find((c) => c.id === characterId);
    if (!character) return;

    const provider = resolveProvider();
    if (!provider) { setError(i18n.t('chat.noApiKey')); return; }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);
    setError(null);

    if (addUserMessage) {
      useConversationStore.getState().addMessage(conversationId, 'user', addUserMessage, undefined);
    }

    try {
      const messages = buildMessages(conversationId, character.systemPrompt, provider.lang);
      await streamResponse(conversationId, characterId, messages, provider, controller.signal);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : i18n.t('common.error', { message: '' }));
    } finally {
      abortRef.current = null;
      setIsGenerating(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return {
    sendMessage: (conversationId: string, content: string) => generate(conversationId, content),
    regenerate: (conversationId: string) => generate(conversationId),
    stop,
    isGenerating,
    error,
  };
}
