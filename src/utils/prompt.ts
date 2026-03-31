import { useSettingsStore } from '../stores/settings';
import { useConversationStore } from '../stores/conversations';
import { getAdapter } from '../adapters/registry';
import { OpenAICompatibleAdapter } from '../adapters/openai-compatible';
import i18n from '../i18n';

const DIRECTIVE = ' Be direct — state your views immediately, no pleasantries, no filler like "great question", no unnecessary preamble. Stay on topic.';

export const ROUNDTABLE_SUFFIX = '\n\nYou are in a roundtable discussion with other thinkers on the user\'s question.';

export function getLangInstruction(lang: string): string {
  const name = i18n.t('nav.replyLanguage', { lng: lang });
  const resolved = name === 'nav.replyLanguage' ? 'English' : name;
  return ` Always respond in ${resolved}.`;
}

export function buildSystemPrompt(characterPrompt: string, lang: string, suffix = ''): string {
  return characterPrompt + suffix + DIRECTIVE + getLangInstruction(lang);
}

/**
 * Resolve adapter, apiKey, and model from current settings.
 * Returns null if any is missing.
 */
export function resolveProvider() {
  const settings = useSettingsStore.getState();
  let adapter = getAdapter(settings.defaultProvider);
  if (!adapter) return null;

  const isCustom = adapter.id === 'custom';

  // Custom provider: inject user's base URL, require it
  if (isCustom) {
    if (!settings.customBaseUrl) return null;
    adapter = new OpenAICompatibleAdapter('custom', adapter.name, settings.customBaseUrl, []);
  }

  const apiKey = settings.apiKeys[settings.defaultProvider] || '';
  // Non-custom providers require an API key
  if (!isCustom && !apiKey) return null;

  const model = settings.defaultModel || (adapter.models[0]?.id ?? '');

  const DEFAULT_CORS_PROXY = 'https://cors.api2026.workers.dev';
  const useCors = !isCustom && settings.corsEnabled[settings.defaultProvider];
  const corsProxy = useCors ? (settings.corsProxy || DEFAULT_CORS_PROXY) : undefined;
  return { adapter, apiKey, model, lang: settings.language, corsProxy, thinkingLevel: settings.thinkingLevel };
}

/**
 * Stream a response from the LLM and write tokens into a conversation message.
 */
export async function streamResponse(
  conversationId: string,
  characterId: string | undefined,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  provider: NonNullable<ReturnType<typeof resolveProvider>>,
  signal?: AbortSignal,
): Promise<void> {
  const store = useConversationStore.getState();
  const msgId = store.addMessage(conversationId, 'character', '', characterId);

  let accumulated = '';
  for await (const token of provider.adapter.chat({
    messages,
    model: provider.model,
    apiKey: provider.apiKey,
    corsProxy: provider.corsProxy,
    thinkingLevel: provider.thinkingLevel !== 'off' ? provider.thinkingLevel : undefined,
    signal,
  })) {
    accumulated += token;
    useConversationStore.getState().updateMessageContent(conversationId, msgId, accumulated);
  }
}
