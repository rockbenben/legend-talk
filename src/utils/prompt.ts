import { useSettingsStore } from '../stores/settings';
import { useConversationStore } from '../stores/conversations';
import { getAdapter } from '../adapters/registry';
import { OpenAICompatibleAdapter } from '../adapters/openai-compatible';
const DIRECTIVE = ' Skip pleasantries and filler — no "great question", no unnecessary preamble. Get straight to your perspective. Stay on topic.';

export const ROUNDTABLE_SUFFIX = '\n\nYou are in a roundtable discussion with other thinkers. Focus on the discussion topic — develop your own perspective. Push deeper with counterexamples or broader connections. You may engage with others\' arguments when relevant. Only respond to what has already been said — never predict or guess what someone who hasn\'t spoken will say. Do not repeat arguments already made. Always anchor your response to the discussion topic. Never conclude, summarize, or end the discussion.';

export const MODERATOR_SYSTEM_PROMPT = `You are the moderator of this roundtable discussion. Your role: guide toward deeper truth, not consensus.

You may see your prior synthesis as context. Track how positions evolved — never repeat prior analysis. Focus on what is NEW.

After each round, provide a brief synthesis (use the same language as the participants, for all labels and content):

1. Identify the core disagreement — but look beyond the surface. Find surprising connections or hidden agreements between seemingly opposed positions.
2. Note what has shifted or deepened since the last round.
3. Pose one question that targets the weakest point in the strongest argument, or the strongest point in the weakest argument.

If arguments are becoming circular, break the cycle: challenge an assumption everyone shares, or ask what evidence would change each participant's mind.

Be concise and incisive. Do not take sides.`;

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
 * Suggest 3-5 characters for a roundtable on the given topic.
 * Returns an array of character IDs from presetCharacters.
 */
export async function suggestCharacters(
  topic: string,
  provider: NonNullable<ReturnType<typeof resolveProvider>>,
  allChars: Array<{ id: string; domain: string }>,
  signal?: AbortSignal,
): Promise<string[]> {
  const charList = allChars.map((c) => `${c.id} [${c.domain}]`).join(', ');
  const validIds = new Set(allChars.map((c) => c.id));
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: `You select 3-5 participants for a roundtable discussion. Each candidate is listed as "id [domain]". Pick characters whose viewpoints create productive tension — not simple pro/con, but a network of distinct angles. Include at least one unexpected perspective from outside the topic's obvious domain. Return ONLY a JSON array of character IDs, e.g. ["socrates","elon-musk","taleb"]. No explanation.`,
    },
    {
      role: 'user',
      content: `Topic: ${topic}\n\nAvailable participants:\n${charList}`,
    },
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

  const match = result.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const ids = JSON.parse(match[0]) as string[];
    return ids.filter((id) => validIds.has(id)).slice(0, 5);
  } catch {
    return [];
  }
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
  // Strip self-referential name tag that models sometimes prepend (e.g. "[拿破仑]: ...")
  const cleaned = accumulated.replace(/^\[[^\]]+\]:\s*/, '');
  if (cleaned !== accumulated) {
    useConversationStore.getState().updateMessageContent(conversationId, msgId, cleaned);
  }
}
