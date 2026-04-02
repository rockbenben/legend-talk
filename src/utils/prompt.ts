import { useSettingsStore } from '../stores/settings';
import { useConversationStore } from '../stores/conversations';
import { getAdapter } from '../adapters/registry';
import { OpenAICompatibleAdapter } from '../adapters/openai-compatible';
const DIRECTIVE = ' Skip pleasantries and filler — no "great question", no unnecessary preamble. Get straight to your perspective. Stay on topic.';

export const ROUNDTABLE_SUFFIX = '\n\nYou are in a roundtable discussion with other thinkers. Engage with their arguments — challenge, refine, or deepen the analysis. Push deeper, raise counterexamples, or connect to broader ideas. Always anchor your response to the discussion topic. Never conclude, summarize, or end the discussion.';

const LANG_NAMES: Record<string, string> = {
  en: 'English', zh: 'Simplified Chinese (简体中文)', 'zh-Hant': 'Traditional Chinese (繁體中文)',
  ja: 'Japanese (日本語)', ko: 'Korean (한국어)', es: 'Spanish (Español)',
  pt: 'Portuguese (Português)', fr: 'French (Français)', de: 'German (Deutsch)',
  it: 'Italian (Italiano)', ru: 'Russian (Русский)', ar: 'Arabic (العربية)',
  tr: 'Turkish (Türkçe)', hi: 'Hindi (हिन्दी)', id: 'Indonesian (Bahasa Indonesia)',
  vi: 'Vietnamese (Tiếng Việt)', th: 'Thai (ไทย)', bn: 'Bengali (বাংলা)',
};

export function getLangInstruction(lang: string): string {
  const name = LANG_NAMES[lang] || LANG_NAMES[lang.split('-')[0]] || 'English';
  return ` Always respond in ${name}.`;
}

export function buildSystemPrompt(characterPrompt: string, lang: string, suffix = ''): string {
  return characterPrompt + suffix + DIRECTIVE + getLangInstruction(lang);
}

/**
 * Distill the core discussion topic from multiple user messages.
 * Filters out meta-instructions like "continue" or language preferences.
 * Only called when there are 2+ user messages in a roundtable.
 */
export async function distillTopic(
  userMessages: string[],
  provider: NonNullable<ReturnType<typeof resolveProvider>>,
  signal?: AbortSignal,
): Promise<string> {
  const numbered = userMessages.map((m, i) => `${i + 1}. ${m}`).join('\n');
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: 'Extract the discussion content from these user messages. Remove ONLY meta-instructions (e.g. "continue", "go on", language/formatting preferences). Preserve all substantive points, questions, conditions, and topic refinements. Output in the same language as the user.' + getLangInstruction(provider.lang),
    },
    { role: 'user', content: numbered },
  ];

  let result = '';
  for await (const token of provider.adapter.chat({
    messages,
    model: provider.model,
    apiKey: provider.apiKey,
    corsProxy: provider.corsProxy,
    signal,
  })) {
    result += token;
  }
  return result.trim();
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
