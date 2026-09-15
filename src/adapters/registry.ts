import type { LLMAdapter, ModelOption } from '../types';
import { OpenAICompatibleAdapter } from './openai-compatible';
import { AnthropicAdapter } from './anthropic';
import { GeminiAdapter } from './gemini';
import { findProvider, PROVIDER_CATALOG } from './providerCatalog.generated';

// ─────────────────────────────────────────────────────────────────────────────
// 厂商事实（模型清单、区域端点、文档与控制台链接、逐 SKU 思考 wire）来自
// providerCatalog.generated.ts。那份文件由同步脚本整份重写 —— 别手改它，也别把
// 这些事实抄回本文件，否则下次同步就会重新分叉。本文件只留【本 app 自己的东西】：
//   · 收录哪几家、显示名、分组
//   · 目录里没有的条目（Custom 兜底项 / Together / Fireworks 等起步地址）
//
// ⚠ adapter id 【就是】目录 key，不另起本地别名 —— 一处命名，省掉一张只会漂的
// 对照表。id 同时是【存档键】（settings store 按它分存 API key、baseUrl、CORS
// 开关），所以改名要配一步 PROVIDER_ID_MIGRATIONS（见 stores/settings.ts），
// 否则老用户打开就是一个解析不出的 provider。
// 两个用途受限的订阅套餐（volcengine 方舟 Coding Plan / alibaba 百炼 Token Plan）
// 在上游目录里标了 hidden（上游网页选择器默认不显示，官方提示非 AI 编程工具/允许
// 范围之外的调用可能被判滥用而封停）；数据本身是全的，hidden 只是上游 UI 的筛选轴，
// 本 app 照收。

// ─────────────────────────────────────────────────────────────────────────────

interface FromCatalogOpts {
  /** 中文/自定义显示名；省略则用目录的名字 */
  name?: string;
  group: string;
  /** 覆盖默认地址。用于协议路径与目录不同的情况（gemini 走 OpenAI 兼容层） */
  baseUrl?: string;
}

/** adapter id 【就是】目录 key —— 不另起本地别名，省掉一张只会漂的对照表。 */
function fromCatalog(key: string, opts: FromCatalogOpts): OpenAICompatibleAdapter {
  const id = key;
  const p = findProvider(key);
  if (!p) throw new Error(`providerCatalog 里没有 "${key}" —— 上游可能已删除该 provider`);
  const eps = p.endpoints.map((e) => ({ label: e.label, url: e.baseUrl }));
  if (!eps.length && !opts.baseUrl) throw new Error(`providerCatalog 的 "${key}" 没有端点，需在本地给出 baseUrl`);

  // 思考参数的线格式逐 SKU 从目录搬过来 —— 不再由本地按 provider 猜一种形态。
  // 目录没给形态的 SKU（已知不思考，或这家没有已知形态）就没有这个字段，
  // 适配器据此一个参数都不发。
  const models: ModelOption[] = p.models.map((m) => ({
    id: m.id,
    name: m.name,
    ...(m.thinkingWire ? { thinkingWire: m.thinkingWire } : {}),
  }));

  return new OpenAICompatibleAdapter(id, opts.name ?? p.label, opts.baseUrl ?? eps[0].url, models, {
    docsUrl: p.docs,
    apiKeyUrl: p.apiKeyUrl,
    fallbackThinkingWire: p.thinkingWire,
    group: opts.group,
    // 目录 hidden：默认选择器过滤，行为层照常（已存配置/导入/解析不受影响）。
    ...(p.hidden ? { hidden: true as const } : {}),
    // endpoints[0].url 必须等于 baseUrl（见 EndpointOption 的约定），所以本地
    // 覆盖了地址时不给备选列表。
    ...(eps.length > 1 && !opts.baseUrl ? { endpoints: eps } : {}),
  });
}

/**
 * 收录清单：目录 key → 本 app 的呈现与传输选项。
 *
 * ⚠ 这里【只管收录，不管顺序】—— adapters 按目录顺序生成，上游调整排序或在中间
 * 插入一家时这边自动跟上。分组（PROVIDER_GROUPS）仍由本 app 定：目录只分
 * llm / aggregator 两类，而聊天场景下国内/国外的区分对用户更有用。
 *
 * 未收录的两家不是漏了：
 *   · yandex —— model 必须是 gpt://<folderId>/<model> 这种 URI，本 app 没有
 *     folderId 字段，列上短模型名会每请求 400
 *   · azureopenai —— 认证头是 api-key 而非 Bearer，URL 还要拼
 *     /openai/deployments/<部署名>?api-version=…，OpenAICompatibleAdapter 两条都不符
 * llm 不在表里：兜底项单独给，永远排最后。
 */
const PICKED: Record<string, FromCatalogOpts> = {
  deepseek: { name: 'DeepSeek', group: 'china' },
  openai: { name: 'OpenAI', group: 'international' },
  // claude / gemini 走各自的【原生】协议（/v1/messages、:streamGenerateContent），
  // 不走 OpenAI 兼容层 —— 与上游说同一套协议，形态才能对齐。两者都是手写适配器，
  // 名字与模型清单由那两个类自己从目录取，这里只声明分组。
  claude: { group: 'international' },
  gemini: { group: 'international' },
  qwen: { name: '通义千问（阿里百炼）', group: 'china' },
  // 形态逐 SKU 不同（k3 收顶层 reasoning_effort，K2.x 收 thinking:{type}）——
  // 目录按 SKU 给，这里不用管。
  moonshot: { name: 'Moonshot / Kimi', group: 'china' },
  doubao: { name: '豆包（火山方舟）', group: 'china' },
  mimo: { name: '小米 MiMo', group: 'china' },
  zhipu: { name: '智谱 GLM', group: 'china' },
  minimax: { name: 'MiniMax', group: 'china' },
  stepfun: { name: '阶跃星辰 StepFun', group: 'china' },
  qianfan: { name: '百度千帆', group: 'china' },
  mistral: { name: 'Mistral', group: 'international' },
  grok: { name: 'xAI Grok', group: 'international' },
  cohere: { name: 'Cohere', group: 'international' },
  openrouter: { name: 'OpenRouter', group: 'aggregator' },
  opencode: { name: 'OpenCode Zen', group: 'aggregator' },
  // 腾讯把文生文整体迁到了 TokenHub 聚合网关：换了域名也换了模型 id，旧的混元
  // key 打不通新端点，所以 id 也换了（见 PROVIDER_ID_MIGRATIONS）。
  tokenhub: { name: '腾讯 TokenHub', group: 'china' },
  groq: { name: 'Groq', group: 'aggregator' },
  cerebras: { name: 'Cerebras', group: 'aggregator' },
  siliconflow: { name: 'SiliconFlow', group: 'aggregator' },
  atlascloud: { name: 'AtlasCloud', group: 'aggregator' },
  nvidia: { name: 'NVIDIA NIM', group: 'aggregator' },
  // 订阅套餐端点 —— 上游目录里标了 hidden（默认选择器不显示，官方文档称非 AI
  // 编程工具 / 允许范围之外使用套餐端点可能被判定滥用而封停账号/订阅），本 app
  // 一直收录，事实（专属 host、SKU 清单、思考 wire、directBlocked）全部由目录下发。
  // alibaba 2026-09 由 Coding Plan 换成 Token Plan（host 与 SKU 全换）；旧套餐
  // 存档里的失效 SKU 不做迁移，存量用户报错后在设置里重选即可。
  volcengine: { name: '字节方舟 Coding Plan', group: 'china' },
  alibaba: { name: '阿里百炼 Token Plan', group: 'china' },
};

// 收录了却在目录里找不到 = 上游删了这家。显式报错，不要让 filter 静默吞掉。
for (const key of Object.keys(PICKED)) {
  if (!findProvider(key)) throw new Error(`PICKED 收录了 ${key}，但 providerCatalog 里没有 —— 上游已删除该 provider，请更新 PICKED`);
}

const adapters: LLMAdapter[] = [
  // 目录里的每一家，【按目录顺序】。收录清单 PICKED 只管收不收、叫什么、归哪组
  // —— 顺序与思考参数形态都不在这里定。
  ...PROVIDER_CATALOG.filter((p) => p.key in PICKED).map((p) => {
    // 说原生协议的两家用自己的适配器；放在这个遍历里（而不是数组开头）是为了
    // 让它们落在目录给的位置上。
    if (p.key === 'claude') return new AnthropicAdapter() as LLMAdapter;
    if (p.key === 'gemini') return new GeminiAdapter() as LLMAdapter;
    return fromCatalog(p.key, PICKED[p.key]!);
  }),

  // 通用兜底项 —— 目录里它就叫 llm / Custom (OpenAI-compatible)。地址留空表示
  // 「用户自己填」（存在 settings 的 customBaseUrl 里），所以不走 fromCatalog：
  // 目录给它列的是常见本地/自建服务的起步地址，那是选填建议不是默认值，
  // 单独由 CUSTOM_ENDPOINTS 导出给设置界面当快捷填充。
  new OpenAICompatibleAdapter(
    'llm',
    'Custom (OpenAI-compatible)',
    '',
    [],
    { group: 'custom' },
  ),
];
/**
 * Custom (llm) 的起步地址建议 —— Ollama / LM Studio / llama.cpp / LiteLLM /
 * Together AI / Fireworks AI 之类「只是地址不同的 OpenAI 兼容端点」。它们【不】
 * 各占一个 adapter：单列出来就得各自维护一份模型清单，而那正是要消灭的手工活。
 * 每条各自带 docs：背后是一个独立产品，用户得先照着它的说明把服务跑起来。
 * 与区域端点不同，这些不是同一服务的变体，所以不进 adapter 的 `endpoints`
 * （那个字段的约定是 endpoints[0].url === baseUrl），只给设置界面当快捷填充。
 */
export const CUSTOM_ENDPOINTS: ReadonlyArray<{ label: string; url: string; docs?: string }> = (findProvider('llm')?.endpoints ?? []).map((e) => ({
  label: e.label,
  url: e.baseUrl,
  docs: e.docs,
}));

/**
 * 默认就该走代理的 provider —— 浏览器直连当前是坏的（CORS 缺头 / 预检 404 /
 * 按 origin 拦截），不开代理每个请求都发不出去。
 *
 * 全部由目录的 `directBlocked` 派生，不再手抄：上游把某家修好了、或者新收录的
 * 某家（含两个订阅套餐端点）一上来就是坏的，跑一次同步这边就跟上。手抄的下场
 * 发生过 —— 加 opencode 时没同步这张表，而它的直连本来就不通。
 */
export const PROXY_BY_DEFAULT: Record<string, boolean> = {
  ...Object.fromEntries(PROVIDER_CATALOG.filter((p) => p.directBlocked && p.key in PICKED).map((p) => [p.key, true])),
};

export const PROVIDER_GROUPS: Array<{ id: string; labelKey: string }> = [
  { id: 'international', labelKey: 'settings.providerGroupInternational' },
  { id: 'china', labelKey: 'settings.providerGroupChina' },
  { id: 'aggregator', labelKey: 'settings.providerGroupAggregator' },
  { id: 'custom', labelKey: 'settings.providerGroupCustom' },
];

export function getAllAdapters(): LLMAdapter[] {
  return adapters;
}

export function getAdapter(id: string): LLMAdapter | undefined {
  return adapters.find((a) => a.id === id);
}

/**
 * 旧 provider id → 现 id。provider id 统一成了目录 key，而 id 是 settings store
 * 里 apiKeys / modelByProvider / thinkingByProvider / corsEnabled /
 * baseUrlByProvider 五张表的键 —— 迁移必须五张一起改名（见 stores/settings.ts
 * 的 v3），只改 defaultProvider 会把用户配好的 key 留在读不到的旧键下。
 *
 * hunyuan → tokenhub 不只是改名：腾讯换了 host 也换了模型 id，旧 key 打不通新
 * 端点。仍然搬过来是因为「搬一把失效的 key」比「静默丢掉用户填过的东西」好 ——
 * 前者用户看得见、能自己换，后者只表现为输入框莫名其妙空了。
 */
export const PROVIDER_ID_MIGRATIONS: Record<string, string> = {
  anthropic: 'claude',
  xai: 'grok',
  hunyuan: 'tokenhub',
  custom: 'llm',
  // 上游把 LiteLLM 并进了 Custom（它和 Together / Fireworks 一样，只是地址不同的
  // OpenAI 兼容端点）。不搬的后果不是「少一个选项」而是【设置面板整个塌掉】：
  // defaultProvider 停在一个 getAdapter 解析不出的 id 上，currentAdapter 为
  // undefined，地址框、模型下拉、文档链接全都不渲染 —— 用户看到的是 Custom
  // 那一栏凭空消失，而不是被换掉了。地址的搬运见 stores/settings.ts 的 v4。
  litellm: 'llm',
};

/**
 * Renamed/removed model ids → their surviving successor. Applied by the settings
 * persist `migrate` so a returning user's stored selection (defaultModel or the
 * per-provider memory) doesn't POST a dead SKU that 400s. Only EXACT known-old ids
 * are remapped; anything else — including user-typed custom SKUs — passes through
 * untouched. Keys are full id strings, so a flat map is unambiguous.
 *
 * ⚠ 两条不变量由 tests/adapters/registry.test.ts 机械保证，别靠人肉核对：
 *   ① 每个 target 必须是【当前存在】的模型 id —— 迁移只跑一次，指向另一个已死
 *     的 id 等于没迁（旧版就出现过一串 hunyuan-* → hunyuan-a13b，而 a13b 本身
 *     随后也退役了）。
 *   ② 每个 key 必须【不再存在】于任何 adapter —— 订阅套餐与官方线在售的型号
 *     长期有重名（如 qwen3.6-plus / glm-5 至今在硅基/智谱官方线在售），把它们
 *     写进迁移表会把别的 adapter 用户的选择改掉。
 */
export const MODEL_ID_MIGRATIONS: Record<string, string> = {
  // OpenAI — gpt-5.4 dropped (5.4-mini kept); 5.6 is the current flagship.
  'gpt-5.4': 'gpt-5.6',
  // Anthropic — 4.7 / 4.8 已退役，Opus 5 是当前旗舰。
  'claude-opus-4-7': 'claude-opus-5',
  'claude-opus-4-8': 'claude-opus-5',
  'claude-sonnet-4-6': 'claude-sonnet-5',
  // Mistral — bare version-number ids were never callable; -latest aliases are.
  'mistral-small-4': 'mistral-small-latest',
  'mistral-large-3': 'mistral-large-latest',
  'ministral-3-14b': 'ministral-14b-latest',
  'magistral-medium-1-2': 'mistral-medium-3-5',
  // xAI — 4.3 与 4.20 系列退役，在产只剩 4.6 / 4.5。
  'grok-4.3': 'grok-4.5',
  'grok-4.20-0309-reasoning': 'grok-4.5',
  'grok-4.20-0309-non-reasoning': 'grok-4.5',
  'grok-4.20-multi-agent-0309': 'grok-4.5',
  // Moonshot — kimi-latest 别名不再指向在产型号。
  'kimi-latest': 'kimi-k2.6',
  // Zhipu — GLM-4.x 全系退役。
  'glm-4.6': 'glm-5.2',
  'glm-4.5-air': 'glm-5-turbo',
  'glm-4.5-airx': 'glm-5-turbo',
  'glm-4.7-flash': 'glm-5-turbo',
  'glm-4.7-flashx': 'glm-5-turbo',
  'glm-4-long': 'glm-5-turbo',
  'glm-4-flashx-250414': 'glm-5-turbo',
  'glm-4-flash-250414': 'glm-5-turbo',
  // MiniMax — M2.1 退役。
  'MiniMax-M2.1': 'MiniMax-M3',
  // 火山 Coding Plan 2026-09-15 换架（官方快速开始页 Model Name 表）：整批旧别名
  // 下架。minimax-m2.5 小写是火山专属别名（百炼那边是大写 MiniMax-M2.5，不同字符串）。
  'doubao-seed-2.0-code': 'doubao-seed-evolving',
  'doubao-seed-2.0-pro': 'doubao-seed-evolving',
  'doubao-seed-code': 'doubao-seed-evolving',
  'kimi-k2-thinking': 'kimi-k3',
  'deepseek-v4': 'deepseek-v4-pro',
  'minimax-m2.5': 'minimax-m3',
  // 百炼 Coding Plan → Token Plan（2026-09）：旧套餐 SKU 几乎全换（qwen3.5-plus /
  // qwen3-max-* / qwen3-coder-* / kimi-k2.5 / glm-4.7 / MiniMax-M2.5 等），只
  // qwen3.7-plus 一个重叠。这批【不登记迁移】：套餐存量用户极少，旧 id 请求报错后
  // 在设置里重选即可（仓库方针：全量发布、不做向后兼容垫片）。qwen3.6-flash 在
  // 新套餐里重新在售，昨天一度登记的迁移已撤回。
  'qwen3.6-max-preview': 'qwen3.7-plus',
  // 腾讯 — 混元文生文 2026-06-22 整体退役，服务迁到 TokenHub，hy3 是接续型号。
  'hunyuan-turbos-latest': 'hy3',
  'hunyuan-2.0-thinking-20251109': 'hy3',
  'hunyuan-2.0-instruct-20251111': 'hy3',
  'hunyuan-t1-latest': 'hy3',
  'hunyuan-lite': 'hy3',
  'hunyuan-a13b': 'hy3',
  // OpenRouter (prefixed ids, distinct from the bare provider ids above)
  'anthropic/claude-opus-4.7': 'anthropic/claude-opus-5',
  'anthropic/claude-opus-4.8': 'anthropic/claude-opus-5',
  'anthropic/claude-sonnet-4.6': 'anthropic/claude-sonnet-5',
  'google/gemini-3.1-flash-lite-preview': 'google/gemini-3.7-flash',
  'google/gemini-3.5-flash': 'google/gemini-3.7-flash',
  'minimax/minimax-m2.7': 'minimax/minimax-m3',
  'x-ai/grok-4.3': 'x-ai/grok-4.6',
  'x-ai/grok-4.20': 'x-ai/grok-4.6',
  'deepseek/deepseek-v4-pro': 'deepseek/deepseek-v4.1-flash',
  'xiaomi/mimo-v2-pro-20260318': 'deepseek/deepseek-v4.1-flash',
  // SiliconFlow — 小写 org 前缀 404，MiniMaxAI 才是真 org；该站 MiniMax 线已下架，
  // 直接回落到它在售的 DeepSeek。
  // 裸的 MiniMaxAI/MiniMax-M2.5 不在此列：Together AI 仍在售同名 SKU。
  'minimax/MiniMax-M2.5': 'deepseek/deepseek-v4.1-flash',
  // Groq — Llama 线下架，gpt-oss 是接续。
  'llama-3.3-70b-versatile': 'openai/gpt-oss-120b',
  'llama-3.1-8b-instant': 'openai/gpt-oss-20b',
  // Cerebras
  'llama3.1-8b': 'gemma-4-31b',
  'qwen-3-235b-a22b-instruct-2507': 'gpt-oss-120b',
  'zai-glm-4.7': 'gpt-oss-120b',
  // NVIDIA NIM
  'z-ai/glm-5.1': 'z-ai/glm-5.2',
  'meta/llama-3.1-70b-instruct': 'meta/llama-3.3-70b-instruct',
};

/** Remap one id through MODEL_ID_MIGRATIONS; unknown/custom ids pass through. */
export function migrateModelId(id: unknown): unknown {
  return typeof id === 'string' && MODEL_ID_MIGRATIONS[id] ? MODEL_ID_MIGRATIONS[id] : id;
}
