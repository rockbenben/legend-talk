import { useSettingsStore } from '../stores/settings';
import { useConversationStore } from '../stores/conversations';
import { getAdapter } from '../adapters/registry';
import type { LLMAdapter } from '../types';
import { findProvider } from '../adapters/providerCatalog.generated';
import { OpenAICompatibleAdapter } from '../adapters/openai-compatible';
import { STALL_TIMEOUT_MS } from '../adapters/sse';
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
/**
 * 测连接：发一次【最小的真实请求】，走的就是聊天那条路。
 *
 * 不去打 /models 之类的旁路端点 —— 那种探测通了也不代表能聊：路径不同、很多
 * 厂商的 key 权限也不同，绿灯之后第一条消息照样失败。这里连模型名、思考参数、
 * 自定义地址、CORS 代理都是正式请求的那一份，绿了就是真能用。
 *
 * 拿到第一个 token 就 abort：验证的是「这条链路通不通」，不是让模型把话说完，
 * 没必要为一次点击烧完整回复的 token。
 *
 * ⚠ 耐心与正式请求【同一档】（STALL_TIMEOUT_MS），不能另设一个更短的。两个
 * 适配器都只吐【可见文本】增量（Anthropic 丢掉 thinking_delta，Gemini 过滤
 * thought:true 的 part），所以「第一个 token」是把思考时间整个算在内的：高档
 * 思考下等上一两分钟很正常。给短了，测出来的是「这台机器慢」而不是「这条链路
 * 不通」，而界面会把它显示成连接失败 —— 一份完全好用的配置被判红。
 *
 * 失败时把原始错误抛出去（适配器已经把它整成 `[401] …` 这种带状态码的形状），
 * 由调用方决定怎么显示 —— 只回一个 boolean 会把「key 错了」和「地址不通」
 * 压成同一句没用的「连接失败」。
 */
export async function probeConnection(
  provider: NonNullable<ReturnType<typeof resolveProvider>>,
  timeoutMs = STALL_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // 外部取消挂到同一个 controller 上：超时与用户手动停止走同一条收尾路径。
  // 需要这个口子是因为耐心给到了 3 分钟 —— 没有它，链路通着却不出字的时候，
  // 界面上就是一个转三分钟、点不动的按钮。
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener('abort', onAbort, { once: true });
  try {
    for await (const _chunk of provider.adapter.chat({
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      model: provider.model,
      apiKey: provider.apiKey,
      corsProxy: provider.corsProxy,
      thinkingLevel: provider.thinkingLevel,
      signal: controller.signal,
    })) {
      break;
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    // break 之后 fetch 的响应体还开着 —— 显式 abort 掉，别把连接挂在那里。
    controller.abort();
  }
}

/** 内置的那台公共中转。留空即用它；用户可在设置里换成自建的。 */
export const DEFAULT_CORS_PROXY = 'https://cors.api2026.workers.dev';

/** 这个地址【是不是官方地址】—— 适配器自己的默认地址，或它列出的官方变体之一。 */
function isOfficialUrl(adapter: LLMAdapter, url: string | undefined): boolean {
  const u = url?.trim().replace(/\/+$/, '');
  if (!u) return true; // 留空 = 用官方默认
  if (u === adapter.baseUrl?.replace(/\/+$/, '')) return true;
  const eps = (adapter as { endpoints?: Array<{ url: string }> }).endpoints ?? [];
  return eps.some((e) => e.url.replace(/\/+$/, '') === u);
}

/**
 * 这一跳中转【转不转得了】当前这个地址。
 *
 * 内置的公共中转按 host 白名单转发：自填的自建网关既不在名单里，局域网地址它
 * 也根本够不着，转过去只会拿到 400；更要紧的是，把可能带 ?token=SECRET 的自建
 * 地址交给第三方中转本身就是泄露。所以「内置中转 + 自填地址」这一种组合退回直连。
 *
 * 用户换成自建中转（corsProxy 不是内置那台）则是另一回事：那台机器归他所有、
 * 白名单由他声明 —— 照发。这正是两轴解耦要支持的场景。
 */
export function proxyWouldServe(adapter: LLMAdapter, url: string | undefined, corsProxy: string): boolean {
  const usesBuiltin = !corsProxy.trim() || corsProxy.trim().replace(/\/+$/, '') === DEFAULT_CORS_PROXY;
  return !usesBuiltin || isOfficialUrl(adapter, url);
}

/**
 * 「这家配好了吗」—— resolveProvider 与界面上那条未配置横幅的【同一份判据】。
 *
 * 抄成两份的下场是两个闸门各说各话：横幅说没配好、发送却放行（或反过来）。
 * 曾经就是三份（这里、ChatView、ChatPage），只是碰巧对得上；目录里再多一家
 * keyOptional，界面那两份就会漏。
 */
export function isProviderConfigured(s: { defaultProvider: string; apiKeys: Record<string, string>; customBaseUrl: string }): boolean {
  // Custom 的凭据是【地址】本身，不是 key。
  if (s.defaultProvider === 'llm') return !!s.customBaseUrl.trim();
  // 「地址即凭据」的自建网关 / 本地推理：本地模型根本没有 key 这个概念，
  // 卡住只会逼用户随便编一个字符串糊弄过去。判据取自目录。
  if (findProvider(s.defaultProvider)?.keyOptional) return true;
  return !!s.apiKeys[s.defaultProvider]?.trim();
}

export function resolveProvider() {
  const settings = useSettingsStore.getState();
  let adapter = getAdapter(settings.defaultProvider);
  if (!adapter) return null;

  // ⚠ 'llm' 是【目录 key】，与 PROVIDER_GROUPS 里那个叫 'custom' 的分组 id 同名
  // 不同物。此处比的是 provider id —— 曾经写成 'custom'，改名后这一行恒 false，
  // 表现是自定义 provider 的 baseUrl 永远不注入、请求打到空地址。
  const isCustom = adapter.id === 'llm';

  if (!isProviderConfigured(settings)) return null;

  // Custom provider: inject user's base URL, require it
  if (isCustom) {
    adapter = new OpenAICompatibleAdapter('llm', adapter.name, settings.customBaseUrl, []);
  }

  // A regional endpoint the user picked, or a gateway they typed. Cloning keeps
  // models / thinking shape / links — only the host moves.
  // 每家都给这个逃生口（包括 claude / gemini 两个原生适配器）：谁会被上游按
  // origin 拦无法预判，逐个手发必然漏掉最需要它的人。
  const override = settings.baseUrlByProvider?.[settings.defaultProvider]?.trim();
  // ⚠ 判「是不是官方地址」必须拿【换址【前】的适配器】比 —— 换完之后它的
  // baseUrl 就是用户填的那个，比出来永远是"官方"，中转的那道闸等于不存在。
  const official = adapter;
  if (!isCustom && override && adapter.withBaseUrl) {
    adapter = adapter.withBaseUrl(override.replace(/\/+$/, ''));
  }

  const apiKey = settings.apiKeys[settings.defaultProvider] || '';

  const model = settings.defaultModel || (adapter.models[0]?.id ?? '');

  // 中转与地址是【正交】的两轴：地址决定打哪儿，这个开关决定走不走那一跳。
  // 唯一的组合限制在 proxyWouldServe —— 内置的那台公共中转按 host 白名单转发，
  // 自填地址它既够不着（局域网）也不放行（不在名单），而且把可能带 ?token=SECRET
  // 的自建网关地址交给第三方中转本身就是泄露。这种组合【退回直连】而不是报错：
  // 用户要的是"用我的网关"，中转只是他没用上的那一档。
  const useCors =
    !isCustom &&
    settings.corsEnabled[settings.defaultProvider] &&
    proxyWouldServe(official, override, settings.corsProxy);
  // Strip trailing slashes — the proxy rejects "proxy.com//https://..." with a 400.
  const corsProxy = useCors ? (settings.corsProxy || DEFAULT_CORS_PROXY).replace(/\/+$/, '') : undefined;
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
  // Builders return [] when the conversation vanished mid-flight (e.g. deleted during
  // a roundtable). Nothing to send — don't create a phantom bubble or POST empty messages.
  if (messages.length === 0) return;

  const store = useConversationStore.getState();
  const msgId = store.addMessage(conversationId, 'character', '', characterId);

  // Throttle token flushes: writing to the store every token triggers a full
  // conversations array clone + persist serialization (LS + IDB). Batching to
  // ~50ms (≈ 20 fps perceived streaming) keeps text fluid while cutting
  // serialization work by 4-10× at typical LLM token rates.
  let accumulated = '';
  let lastFlushed = '';
  let lastFlushAt = 0;
  const FLUSH_MS = 50;
  const flush = () => {
    if (accumulated === lastFlushed) return;
    useConversationStore.getState().updateMessageContent(conversationId, msgId, accumulated);
    lastFlushed = accumulated;
    lastFlushAt = Date.now();
  };
  try {
    for await (const token of provider.adapter.chat({
      messages,
      model: provider.model,
      apiKey: provider.apiKey,
      corsProxy: provider.corsProxy,
      thinkingLevel: provider.thinkingLevel !== 'off' ? provider.thinkingLevel : undefined,
      signal,
    })) {
      accumulated += token;
      if (Date.now() - lastFlushAt >= FLUSH_MS) {
        // Conversation deleted mid-stream — stop consuming so the underlying
        // connection is cancelled instead of billing tokens into the void.
        if (!useConversationStore.getState().getConversation(conversationId)) return;
        flush();
      }
    }
  } finally {
    // Always flush pending tokens — on success, abort, or error — so partial
    // output is preserved (matches prior "save what you got" semantics).
    flush();
    // Strip self-referential name tag that models sometimes prepend (e.g. "[拿破仑]: ...")
    // Limit bracket content to 1-20 chars to avoid stripping legitimate bracketed text.
    // Runs in finally so a stopped/aborted partial message is cleaned too.
    const cleaned = accumulated.replace(/^\[[^\]]{1,20}\]:\s*/, '');
    if (cleaned !== accumulated) {
      useConversationStore.getState().updateMessageContent(conversationId, msgId, cleaned);
    }
  }
}
