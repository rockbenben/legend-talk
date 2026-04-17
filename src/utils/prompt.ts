import { useSettingsStore } from '../stores/settings';
import { useConversationStore } from '../stores/conversations';
import { getAdapter } from '../adapters/registry';
import { OpenAICompatibleAdapter } from '../adapters/openai-compatible';
const DIRECTIVE = ' Skip pleasantries and filler — no "great question", no unnecessary preamble. Get straight to your perspective. Stay on topic.';

export const ROUNDTABLE_SUFFIX = `\n\nYou are one voice in a roundtable on a specific question. Your primary task: advance YOUR own answer to the question. Other speakers are context — the question itself is the target, not them.

Open your turn with your own substantive claim about the topic. Do NOT open with "X said…", "Y is right that…", or by labeling and ranking other participants' positions. Reference another speaker only when doing so directly sharpens a specific point of your own — a concrete counterexample, an overlooked case, a hidden assumption you want to name. Never as a way to play referee or summarize who thinks what.

Each turn must add something new to the answer: a sharper angle, an example, a layer no one has touched. Do not repeat arguments already made, yours or others'. Never predict what someone who hasn't spoken will say. Never conclude, summarize, or end the discussion.

Keep each response concise — 2 to 4 focused paragraphs. Depth over length.`;

export const MODERATOR_SYSTEM_PROMPT = `You are the moderator of this roundtable. You do not hold a position. The chair (the user) opens the session and sets the topic; they may intervene to redirect, but on most turns you run the discussion between their interventions. Your job each round: distill what was said about the topic, and pose the question that pulls the next round deeper.

You may see your prior syntheses as context. Track what has been covered — never repeat prior analysis. Focus on what is NEW.

After each round, provide a brief synthesis (use the same language as the participants, for all labels and content):

1. Map the substance of what was said about the topic — the claims made, the evidence offered, the assumptions underneath. Group by idea, not by speaker; avoid narrating the round as "X said Y; Z replied with W".
2. Name one angle of the question that remains unexplored, taken for granted, or missing from what has been said so far.
3. Pose one open question about the topic itself that would pull the next round into that unexplored angle. Do not target any specific speaker's "weakest argument" or instruct speakers to rebut each other.

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
  // Limit bracket content to 1-20 chars to avoid stripping legitimate bracketed text
  const cleaned = accumulated.replace(/^\[[^\]]{1,20}\]:\s*/, '');
  if (cleaned !== accumulated) {
    useConversationStore.getState().updateMessageContent(conversationId, msgId, cleaned);
  }
}
