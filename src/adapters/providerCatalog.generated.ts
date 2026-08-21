// ⚠ 自动生成，请勿手改 —— 手改会在下次同步时被整份覆盖。
// 更新模型清单 / 端点 / 链接：跑 provider 目录同步脚本重新生成本文件。
//
// 这里只有【厂商事实】：模型 id、区域端点、文档与控制台链接、逐 SKU 思考能力，
// 以及思考参数该往请求体里合并什么（thinkingWire / thinkingWireIf）。
// 形态按各 provider 的 protocol 给：claude / gemini 是【原生协议】的形状，走
// OpenAI 兼容层时不适用。怎么发（流式/超时/重试/max_tokens）仍是各 app 自己的事。
// 不含机器翻译类 provider。

export interface CatalogEndpoint {
  /** 区域/产品线标签，如 "Mainland (CN)" / "International" */
  label: string;
  /** 完整请求地址 */
  url: string;
  /** 去掉动作路径后的 base，如 https://api.deepseek.com */
  baseUrl: string;
  /**
   * 该端点【自己】的文档。只出现在「一个端点就是一个独立产品」的场合
   * （Custom 底下的 LM Studio / Ollama / LiteLLM…）—— provider 级的 docs 对
   * 它们没有意义，而这恰恰是最需要先读上游文档的一条路。同一服务的地域/计费
   * 变体共用 provider 级 docs，不带这个字段。
   */
  docs?: string;
}

export interface CatalogModel {
  id: string;
  name: string;
  /** 该 SKU 支持思考模式 */
  thinking?: boolean;
  /** 该 SKU 接受的思考档位，由低到高。声明它 = 厂商没有关闭开关，最低档就是"最关" */
  thinkingLevels?: readonly string[];
  /**
   * 各档位该往请求体里合并的字段。缺省 = 这个 SKU 不发任何思考参数
   * （已知不思考，或该 provider 没有已知的线格式 —— 两种都不该乱发）。
   * 缺 off 键 = 关闭态也不发（厂商没有关闭值时由最低档承担，见 thinkingLevels）。
   *
   * ⚠ 形态是按该 provider 的 protocol 字段给的。claude / gemini 这里给的是【原生
   * 协议】的形状（/v1/messages、:streamGenerateContent）—— 你要是改走 OpenAI
   * 兼容层，这份不适用。
   */
  thinkingWire?: {
    off?: Record<string, unknown>;
    low?: Record<string, unknown>;
    medium?: Record<string, unknown>;
    high?: Record<string, unknown>;
  };
}

export interface CatalogProvider {
  key: string;
  label: string;
  category: "llm" | "aggregator";
  /** 决定走哪个 adapter */
  protocol: string;
  docs?: string;
  apiKeyUrl?: string;
  defaultModel?: string;
  /** false = 这家没有关闭值，关闭态只能发最低档（仍在推理、仍在计费） */
  canDisableThinking: boolean;
  /**
   * true = 该 provider 当前【浏览器直连是坏的】（CORS 缺头 / 预检 404 / 按 origin
   * 拦截），必须经代理或中转。是实测得出的当前事实，不是永恒属性 —— 上游修好后
   * 会在下次同步里变回 false，所以别把它硬编码进业务分支，跟着这个字段走。
   */
  directBlocked: boolean;
  /**
   * true = 这家的【地址才是凭据】，apiKey 可选甚至根本不存在（自建网关、局域网
   * 里的本地推理服务）。界面不该拿「没填 key」拦住开跑 —— 那会让本地模型完全用
   * 不了，而用户只能随便编一个字符串糊弄过去。
   */
  keyOptional?: boolean;
  /**
   * 用户手填的、不在 models 清单里的 SKU 该发的思考参数（能力未知，按本 provider
   * 的通用形态走）。清单内的 SKU 用它自己的 thinkingWire —— 有的 provider 逐 SKU
   * 形态不同（moonshot 的 kimi-k3 收顶层 reasoning_effort，K2.x 收 thinking:{type}），
   * 拿 provider 级形态套上去会 4xx。
   */
  thinkingWire?: CatalogModel["thinkingWire"];
  /**
   * 未列出 SKU 的【条件】形态：取【第一条】pattern 匹配上的 wire，都不匹配才用
   * 上面的 thinkingWire。目前只有 Claude 有 —— 它的思考协议分两代，而属于哪一代
   * 取决于模型名（官方：4.7 及以后【拒收】budget_tokens，用了直接 400），手填的
   * SKU 不在任何清单里，只能按名字判。
   *
   * ⚠ 是【有序数组】，规则会互相包含：官方标 Always on 的那几支同属新世代，正则
   * 是新世代那条的子集，形态却差在关闭档（它们连 thinking:{type:"disabled"} 都回
   * 400，所以那条规则的 wire 干脆没有 off 键）。窄的排在前面，务必取首个匹配，
   * 别遍历合并。
   *
   * ⚠ 取首个匹配 ⇒ 【没有向宽规则继承这回事】。少一个档位 = 那一档什么都不发，
   * 不是「用宽规则那一档」。所以各规则的非-off 档位集合恒等（生成时断言），只有
   * off 允许缺席（缺 off = 这一支关不掉）。加新规则时别只写差异的那半。
   *
   * 这套规则各 app 各写一份必然漂（已经漂过一次：某次精简把 4.7/4.8 删了，
   * 手填 opus-4-8 就会 400），所以由目录统一下发。
   */
  thinkingWireIf?: readonly { pattern: string; wire: CatalogModel["thinkingWire"] }[];
  /** [0] 为默认端点 */
  endpoints: readonly CatalogEndpoint[];
  models: readonly CatalogModel[];
}

export const PROVIDER_CATALOG: readonly CatalogProvider[] = [
  {
    key: "deepseek",
    label: "DeepSeek",
    category: "llm",
    protocol: "openai",
    docs: "https://api-docs.deepseek.com/",
    apiKeyUrl: "https://platform.deepseek.com/api_keys",
    defaultModel: "deepseek-v4-flash",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"},"reasoning_effort":"high"},"medium":{"thinking":{"type":"enabled"},"reasoning_effort":"high"},"high":{"thinking":{"type":"enabled"},"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.deepseek.com/chat/completions", baseUrl: "https://api.deepseek.com" },
    ],
    models: [
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"},"reasoning_effort":"high"},"medium":{"thinking":{"type":"enabled"},"reasoning_effort":"high"},"high":{"thinking":{"type":"enabled"},"reasoning_effort":"high"}} },
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"},"reasoning_effort":"high"},"medium":{"thinking":{"type":"enabled"},"reasoning_effort":"high"},"high":{"thinking":{"type":"enabled"},"reasoning_effort":"high"}} },
    ],
  },
  {
    key: "openai",
    label: "OpenAI",
    category: "llm",
    protocol: "openai",
    docs: "https://developers.openai.com/api/docs/guides/text",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-5.6-luna",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.openai.com/v1/chat/completions", baseUrl: "https://api.openai.com/v1" },
    ],
    models: [
      { id: "gpt-5.6", name: "GPT-5.6", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "gpt-5.5", name: "GPT-5.5", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
    ],
  },
  {
    key: "claude",
    label: "Claude",
    category: "llm",
    protocol: "anthropic",
    docs: "https://platform.claude.com/docs/en/intro",
    apiKeyUrl: "https://platform.claude.com/settings/keys",
    defaultModel: "claude-sonnet-5",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"low":{"thinking":{"type":"enabled","budget_tokens":4096}},"medium":{"thinking":{"type":"enabled","budget_tokens":10000}},"high":{"thinking":{"type":"enabled","budget_tokens":12000}}},
    thinkingWireIf: [{"pattern":"claude-(fable-5|mythos)","wire":{"low":{"thinking":{"type":"adaptive"},"output_config":{"effort":"low"}},"medium":{"thinking":{"type":"adaptive"},"output_config":{"effort":"medium"}},"high":{"thinking":{"type":"adaptive"},"output_config":{"effort":"high"}}}},{"pattern":"claude-(opus-5|opus-4-[78]|sonnet-5|fable-5|mythos)","wire":{"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"adaptive"},"output_config":{"effort":"low"}},"medium":{"thinking":{"type":"adaptive"},"output_config":{"effort":"medium"}},"high":{"thinking":{"type":"adaptive"},"output_config":{"effort":"high"}}}}],
    endpoints: [
      { label: "Anthropic", url: "https://api.anthropic.com/v1/messages", baseUrl: "https://api.anthropic.com/v1" },
    ],
    models: [
      { id: "claude-opus-5", name: "Claude Opus 5", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"adaptive"},"output_config":{"effort":"low"}},"medium":{"thinking":{"type":"adaptive"},"output_config":{"effort":"medium"}},"high":{"thinking":{"type":"adaptive"},"output_config":{"effort":"high"}}} },
      { id: "claude-sonnet-5", name: "Claude Sonnet 5", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"adaptive"},"output_config":{"effort":"low"}},"medium":{"thinking":{"type":"adaptive"},"output_config":{"effort":"medium"}},"high":{"thinking":{"type":"adaptive"},"output_config":{"effort":"high"}}} },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", thinking: true, thinkingWire: {"low":{"thinking":{"type":"enabled","budget_tokens":4096}},"medium":{"thinking":{"type":"enabled","budget_tokens":10000}},"high":{"thinking":{"type":"enabled","budget_tokens":12000}}} },
      { id: "claude-fable-5", name: "Claude Fable 5", thinking: true, thinkingWire: {"low":{"thinking":{"type":"adaptive"},"output_config":{"effort":"low"}},"medium":{"thinking":{"type":"adaptive"},"output_config":{"effort":"medium"}},"high":{"thinking":{"type":"adaptive"},"output_config":{"effort":"high"}}} },
    ],
  },
  {
    key: "gemini",
    label: "Gemini",
    category: "llm",
    protocol: "gemini",
    docs: "https://ai.google.dev/gemini-api/docs/text-generation",
    apiKeyUrl: "https://aistudio.google.com/app/api-keys",
    defaultModel: "gemini-3.7-flash",
    canDisableThinking: false,
    directBlocked: false,
    thinkingWire: {"off":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"low":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"medium":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"medium"}}},"high":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"high"}}}},
    endpoints: [
      { label: "Google AI", url: "https://generativelanguage.googleapis.com/v1beta/models", baseUrl: "https://generativelanguage.googleapis.com" },
    ],
    models: [
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Preview)", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"low":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"medium":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"medium"}}},"high":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"high"}}}} },
      { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"low":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"medium":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"medium"}}},"high":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"high"}}}} },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", thinking: true, thinkingLevels: ["minimal","low","medium","high"], thinkingWire: {"off":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"minimal"}}},"low":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"medium":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"medium"}}},"high":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"high"}}}} },
      { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite", thinking: true, thinkingLevels: ["minimal","low","medium","high"], thinkingWire: {"off":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"minimal"}}},"low":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"low"}}},"medium":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"medium"}}},"high":{"generationConfig":{"thinkingConfig":{"thinkingLevel":"high"}}}} },
    ],
  },
  {
    key: "qwen",
    label: "Qwen",
    category: "llm",
    protocol: "openai",
    docs: "https://help.aliyun.com/model-studio/qwen-api-via-openai-chat-completions",
    apiKeyUrl: "https://bailian.console.aliyun.com/?tab=model#/api-key",
    defaultModel: "qwen3.7-plus",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"enable_thinking":false},"low":{"enable_thinking":true,"thinking_budget":1024},"medium":{"enable_thinking":true,"thinking_budget":4096},"high":{"enable_thinking":true,"thinking_budget":8192}},
    endpoints: [
      { label: "Mainland (CN)", url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
      { label: "International", url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1" },
      { label: "US", url: "https://dashscope-us.aliyuncs.com/compatible-mode/v1/chat/completions", baseUrl: "https://dashscope-us.aliyuncs.com/compatible-mode/v1" },
    ],
    models: [
      { id: "qwen3.8-max", name: "Qwen3.8 Max", thinking: true, thinkingWire: {"off":{"enable_thinking":false},"low":{"enable_thinking":true,"thinking_budget":1024},"medium":{"enable_thinking":true,"thinking_budget":4096},"high":{"enable_thinking":true,"thinking_budget":8192}} },
      { id: "qwen3.7-plus", name: "Qwen3.7 Plus", thinking: true, thinkingWire: {"off":{"enable_thinking":false},"low":{"enable_thinking":true,"thinking_budget":1024},"medium":{"enable_thinking":true,"thinking_budget":4096},"high":{"enable_thinking":true,"thinking_budget":8192}} },
      { id: "qwen3.7-flash", name: "Qwen3.7 Flash", thinking: true, thinkingWire: {"off":{"enable_thinking":false},"low":{"enable_thinking":true,"thinking_budget":1024},"medium":{"enable_thinking":true,"thinking_budget":4096},"high":{"enable_thinking":true,"thinking_budget":8192}} },
    ],
  },
  {
    key: "moonshot",
    label: "Kimi (Moonshot)",
    category: "llm",
    protocol: "openai",
    docs: "https://platform.kimi.com/docs/models",
    apiKeyUrl: "https://platform.kimi.com/console/api-keys",
    defaultModel: "kimi-k3",
    canDisableThinking: false,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}},
    endpoints: [
      { label: "Mainland (CN)", url: "https://api.moonshot.cn/v1/chat/completions", baseUrl: "https://api.moonshot.cn/v1" },
      { label: "International", url: "https://api.moonshot.ai/v1/chat/completions", baseUrl: "https://api.moonshot.ai/v1" },
    ],
    models: [
      { id: "kimi-k3", name: "Kimi K3", thinking: true, thinkingLevels: ["low","high"], thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"low"},"high":{"reasoning_effort":"high"}} },
      { id: "kimi-k2.6", name: "Kimi K2.6", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
    ],
  },
  {
    key: "doubao",
    label: "Doubao (Volcengine)",
    category: "llm",
    protocol: "openai",
    docs: "https://docs.volcengine.com/docs/82379/1330310",
    apiKeyUrl: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
    defaultModel: "doubao-seed-2-1-turbo-260628",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}},
    endpoints: [
      { label: "Default", url: "https://ark.cn-beijing.volces.com/api/v3/chat/completions", baseUrl: "https://ark.cn-beijing.volces.com/api/v3" },
    ],
    models: [
      { id: "doubao-seed-evolving", name: "Doubao Seed Evolving", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "doubao-seed-2-1-pro-260628", name: "Doubao Seed 2.1 Pro", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "doubao-seed-2-1-turbo-260628", name: "Doubao Seed 2.1 Turbo", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
    ],
  },
  {
    key: "mimo",
    label: "Xiaomi MiMo",
    category: "llm",
    protocol: "openai",
    docs: "https://mimo.mi.com/docs/api/chat/openai-api",
    apiKeyUrl: "https://platform.xiaomimimo.com/console/api-keys",
    defaultModel: "mimo-v2.5",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}},
    endpoints: [
      { label: "Pay-as-you-go", url: "https://api.xiaomimimo.com/v1/chat/completions", baseUrl: "https://api.xiaomimimo.com/v1" },
      { label: "Token Plan (CN)", url: "https://token-plan-cn.xiaomimimo.com/v1/chat/completions", baseUrl: "https://token-plan-cn.xiaomimimo.com/v1" },
      { label: "Token Plan (Singapore)", url: "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions", baseUrl: "https://token-plan-sgp.xiaomimimo.com/v1" },
      { label: "Token Plan (Europe)", url: "https://token-plan-ams.xiaomimimo.com/v1/chat/completions", baseUrl: "https://token-plan-ams.xiaomimimo.com/v1" },
    ],
    models: [
      { id: "mimo-v2.5", name: "MiMo V2.5", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "mimo-v2.5-pro", name: "MiMo V2.5 Pro", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
    ],
  },
  {
    key: "zhipu",
    label: "Zhipu GLM",
    category: "llm",
    protocol: "openai",
    docs: "https://docs.bigmodel.cn/cn/guide/start/introduction",
    apiKeyUrl: "https://bigmodel.cn/usercenter/proj-mgmt/apikeys",
    defaultModel: "glm-5.2",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}},
    endpoints: [
      { label: "Mainland (CN)", url: "https://open.bigmodel.cn/api/paas/v4/chat/completions", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
      { label: "International (Z.ai)", url: "https://api.z.ai/api/paas/v4/chat/completions", baseUrl: "https://api.z.ai/api/paas/v4" },
    ],
    models: [
      { id: "glm-5.3", name: "GLM-5.3" },
      { id: "glm-5.2", name: "GLM-5.2", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "glm-5.1", name: "GLM-5.1", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "glm-5", name: "GLM-5", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "glm-5-turbo", name: "GLM-5 Turbo", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
    ],
  },
  {
    key: "minimax",
    label: "MiniMax",
    category: "llm",
    protocol: "openai",
    docs: "https://platform.minimax.io/docs/api-reference/text-chat-openai",
    apiKeyUrl: "https://platform.minimax.io/console/access",
    defaultModel: "MiniMax-M3",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"adaptive"}},"medium":{"thinking":{"type":"adaptive"}},"high":{"thinking":{"type":"adaptive"}}},
    endpoints: [
      { label: "Mainland (CN)", url: "https://api.minimaxi.com/v1/chat/completions", baseUrl: "https://api.minimaxi.com/v1" },
      { label: "International", url: "https://api.minimax.io/v1/chat/completions", baseUrl: "https://api.minimax.io/v1" },
    ],
    models: [
      { id: "MiniMax-M3", name: "MiniMax M3", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"adaptive"}},"medium":{"thinking":{"type":"adaptive"}},"high":{"thinking":{"type":"adaptive"}}} },
      { id: "MiniMax-M2.7", name: "MiniMax M2.7" },
      { id: "MiniMax-M2.7-highspeed", name: "MiniMax M2.7 High-Speed" },
    ],
  },
  {
    key: "stepfun",
    label: "StepFun (阶跃星辰)",
    category: "llm",
    protocol: "openai",
    docs: "https://platform.stepfun.com/docs/llm/modeloverview",
    apiKeyUrl: "https://platform.stepfun.com/interface-key",
    defaultModel: "step-3.5-flash",
    canDisableThinking: true,
    directBlocked: false,
    endpoints: [
      { label: "Default", url: "https://api.stepfun.com/v1/chat/completions", baseUrl: "https://api.stepfun.com/v1" },
    ],
    models: [
      { id: "step-3.5-flash", name: "Step 3.5 Flash" },
      { id: "step-3.7-flash", name: "Step 3.7 Flash" },
    ],
  },
  {
    key: "qianfan",
    label: "Baidu ERNIE (Qianfan)",
    category: "llm",
    protocol: "openai",
    docs: "https://cloud.baidu.com/doc/qianfan/s/wmh4sv6ya",
    apiKeyUrl: "https://console.bce.baidu.com/iam/#/iam/apikey/list",
    defaultModel: "ernie-5.1",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"enable_thinking":false},"low":{"enable_thinking":true},"medium":{"enable_thinking":true},"high":{"enable_thinking":true}},
    endpoints: [
      { label: "Default", url: "https://qianfan.baidubce.com/v2/chat/completions", baseUrl: "https://qianfan.baidubce.com/v2" },
    ],
    models: [
      { id: "ernie-5.1", name: "ERNIE 5.1" },
      { id: "ernie-5.0", name: "ERNIE 5.0" },
      { id: "ernie-5.0-thinking-latest", name: "ERNIE 5.0 Thinking", thinking: true, thinkingWire: {"off":{"enable_thinking":false},"low":{"enable_thinking":true},"medium":{"enable_thinking":true},"high":{"enable_thinking":true}} },
      { id: "ernie-x1.1", name: "ERNIE X1.1" },
      { id: "ernie-4.5-turbo-128k", name: "ERNIE 4.5 Turbo 128K" },
      { id: "ernie-4.5-turbo-32k", name: "ERNIE 4.5 Turbo 32K" },
    ],
  },
  {
    key: "mistral",
    label: "Mistral",
    category: "llm",
    protocol: "openai",
    docs: "https://docs.mistral.ai/api/",
    apiKeyUrl: "https://console.mistral.ai/api-keys",
    defaultModel: "mistral-medium-3-5",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"high"},"medium":{"reasoning_effort":"high"},"high":{"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.mistral.ai/v1/chat/completions", baseUrl: "https://api.mistral.ai/v1" },
    ],
    models: [
      { id: "mistral-medium-3-5", name: "Mistral Medium 3.5", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"high"},"medium":{"reasoning_effort":"high"},"high":{"reasoning_effort":"high"}} },
      { id: "mistral-small-latest", name: "Mistral Small 4", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"high"},"medium":{"reasoning_effort":"high"},"high":{"reasoning_effort":"high"}} },
      { id: "mistral-large-latest", name: "Mistral Large 3" },
      { id: "ministral-14b-latest", name: "Ministral 3 14B" },
    ],
  },
  {
    key: "grok",
    label: "xAI (Grok)",
    category: "llm",
    protocol: "openai",
    docs: "https://docs.x.ai/developers/models",
    apiKeyUrl: "https://console.x.ai/",
    defaultModel: "grok-4.6",
    canDisableThinking: false,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.x.ai/v1/chat/completions", baseUrl: "https://api.x.ai/v1" },
    ],
    models: [
      { id: "grok-4.6", name: "Grok 4.6", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "grok-4.5", name: "Grok 4.5", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
    ],
  },
  {
    key: "cohere",
    label: "Cohere",
    category: "llm",
    protocol: "openai",
    docs: "https://docs.cohere.com/docs/compatibility-api",
    apiKeyUrl: "https://dashboard.cohere.com/api-keys",
    defaultModel: "command-a-plus-05-2026",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"high"},"medium":{"reasoning_effort":"high"},"high":{"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.cohere.ai/compatibility/v1/chat/completions", baseUrl: "https://api.cohere.ai/compatibility/v1" },
    ],
    models: [
      { id: "command-a-plus-05-2026", name: "Command A Plus" },
      { id: "command-a-03-2025", name: "Command A" },
      { id: "command-a-reasoning-08-2025", name: "Command A Reasoning", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"high"},"medium":{"reasoning_effort":"high"},"high":{"reasoning_effort":"high"}} },
      { id: "command-a-translate-08-2025", name: "Command A Translate" },
    ],
  },
  {
    key: "yandex",
    label: "YandexGPT (AI Studio)",
    category: "llm",
    protocol: "yandex",
    docs: "https://aistudio.yandex.ru/docs/en/ai-studio/concepts/api.html",
    apiKeyUrl: "https://aistudio.yandex.ru/platform/folders/",
    defaultModel: "yandexgpt-5.1",
    canDisableThinking: true,
    directBlocked: true,
    endpoints: [
      { label: "Yandex Cloud", url: "https://llm.api.cloud.yandex.net/v1/chat/completions", baseUrl: "https://llm.api.cloud.yandex.net/v1" },
    ],
    models: [
      { id: "yandexgpt-5.1", name: "YandexGPT Pro 5.1" },
      { id: "yandexgpt-5-pro", name: "YandexGPT Pro 5" },
      { id: "yandexgpt-5-lite", name: "YandexGPT Lite 5" },
      { id: "aliceai-llm", name: "Alice AI LLM" },
      { id: "aliceai-llm-flash", name: "Alice AI LLM Flash" },
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
      { id: "qwen3-235b-a22b-fp8", name: "Qwen3 235B" },
      { id: "qwen3.6-35b-a3b", name: "Qwen3.6 35B" },
      { id: "gpt-oss-120b", name: "GPT-OSS 120B" },
      { id: "gpt-oss-20b", name: "GPT-OSS 20B" },
    ],
  },
  {
    key: "openrouter",
    label: "OpenRouter",
    category: "aggregator",
    protocol: "openai",
    docs: "https://openrouter.ai/models?q=free",
    apiKeyUrl: "https://openrouter.ai/settings/keys",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b:free",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}},
    endpoints: [
      { label: "Default", url: "https://openrouter.ai/api/v1/chat/completions", baseUrl: "https://openrouter.ai/api/v1" },
    ],
    models: [
      { id: "nvidia/nemotron-3-super-120b-a12b:free", name: "Nemotron 3 Super 120B (free)" },
      { id: "poolside/laguna-s-2.1:free", name: "Laguna S 2.1 (free)" },
      { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "tencent/hy3", name: "Hy3", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "anthropic/claude-sonnet-5", name: "Claude Sonnet 5", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "anthropic/claude-opus-5", name: "Claude Opus 5", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "google/gemini-3.7-flash", name: "Gemini 3.7 Flash", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "openai/gpt-5.6-luna", name: "GPT-5.6 Luna", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "z-ai/glm-5.3", name: "GLM-5.3" },
      { id: "x-ai/grok-4.5", name: "Grok 4.5" },
      { id: "moonshotai/kimi-k2.6", name: "Kimi K2.6", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
      { id: "minimax/minimax-m3", name: "MiniMax M3", thinking: true, thinkingWire: {"off":{"reasoning":{"enabled":false}},"low":{"reasoning":{"effort":"low"}},"medium":{"reasoning":{"effort":"medium"}},"high":{"reasoning":{"effort":"high"}}} },
    ],
  },
  {
    key: "opencode",
    label: "OpenCode Zen",
    category: "aggregator",
    protocol: "openai",
    docs: "https://opencode.ai/docs/zen/",
    apiKeyUrl: "https://opencode.ai/auth",
    defaultModel: "deepseek-v4-flash-free",
    canDisableThinking: true,
    directBlocked: true,
    endpoints: [
      { label: "Default", url: "https://opencode.ai/zen/v1/chat/completions", baseUrl: "https://opencode.ai/zen/v1" },
    ],
    models: [
      { id: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash (free)" },
      { id: "big-pickle", name: "Big Pickle (free)" },
      { id: "mimo-v2.5-free", name: "MiMo V2.5 (free)" },
      { id: "hy3-free", name: "Hy3 (free)" },
      { id: "nemotron-3-ultra-free", name: "Nemotron 3 Ultra (free)" },
      { id: "nemotron-3.5-lightning-free", name: "Nemotron 3.5 Lightning (free)" },
      { id: "laguna-s-2.1-free", name: "Laguna S 2.1 (free)" },
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
      { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
      { id: "claude-opus-5", name: "Claude Opus 5" },
      { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
      { id: "kimi-k2.6", name: "Kimi K2.6" },
      { id: "glm-5.2", name: "GLM 5.2" },
      { id: "qwen3.6-plus", name: "Qwen3.6 Plus" },
    ],
  },
  {
    key: "tokenhub",
    label: "TokenHub (Tencent)",
    category: "aggregator",
    protocol: "openai",
    docs: "https://cloud.tencent.com/document/product/1823/130079",
    apiKeyUrl: "https://console.cloud.tencent.com/tokenhub/apikey",
    defaultModel: "hy3",
    canDisableThinking: true,
    directBlocked: true,
    endpoints: [
      { label: "Mainland (CN)", url: "https://tokenhub.tencentmaas.com/v1/chat/completions", baseUrl: "https://tokenhub.tencentmaas.com/v1" },
      { label: "International", url: "https://tokenhub-intl.tencentmaas.com/v1/chat/completions", baseUrl: "https://tokenhub-intl.tencentmaas.com/v1" },
    ],
    models: [
      { id: "hy3", name: "Hunyuan hy3" },
      { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash" },
      { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro" },
      { id: "glm-5.3", name: "GLM-5.3" },
      { id: "glm-5.2", name: "GLM-5.2" },
      { id: "kimi-k3", name: "Kimi K3" },
      { id: "kimi-k2.6", name: "Kimi K2.6" },
      { id: "minimax-m3", name: "MiniMax M3" },
      { id: "mimo-v2.5-pro", name: "MiMo V2.5 Pro" },
    ],
  },
  {
    key: "groq",
    label: "Groq",
    category: "aggregator",
    protocol: "openai",
    docs: "https://console.groq.com/docs/text-chat",
    apiKeyUrl: "https://console.groq.com/keys",
    defaultModel: "openai/gpt-oss-20b",
    canDisableThinking: false,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.groq.com/openai/v1/chat/completions", baseUrl: "https://api.groq.com/openai/v1" },
    ],
    models: [
      { id: "openai/gpt-oss-20b", name: "GPT-OSS 20B", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "groq/compound", name: "Groq Compound" },
      { id: "groq/compound-mini", name: "Groq Compound Mini" },
    ],
  },
  {
    key: "cerebras",
    label: "Cerebras",
    category: "aggregator",
    protocol: "openai",
    docs: "https://inference-docs.cerebras.ai/models/overview",
    apiKeyUrl: "https://cloud.cerebras.ai/",
    defaultModel: "gpt-oss-120b",
    canDisableThinking: false,
    directBlocked: false,
    thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}},
    endpoints: [
      { label: "Default", url: "https://api.cerebras.ai/v1/chat/completions", baseUrl: "https://api.cerebras.ai/v1" },
    ],
    models: [
      { id: "gpt-oss-120b", name: "GPT-OSS 120B", thinking: true, thinkingLevels: ["low","medium","high"], thinkingWire: {"off":{"reasoning_effort":"low"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
      { id: "gemma-4-31b", name: "Gemma 4 31B", thinking: true, thinkingWire: {"off":{"reasoning_effort":"none"},"low":{"reasoning_effort":"low"},"medium":{"reasoning_effort":"medium"},"high":{"reasoning_effort":"high"}} },
    ],
  },
  {
    key: "siliconflow",
    label: "SiliconFlow",
    category: "aggregator",
    protocol: "openai",
    docs: "https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions",
    apiKeyUrl: "https://cloud.siliconflow.cn/me/account/ak",
    defaultModel: "deepseek-ai/DeepSeek-V4-Flash",
    canDisableThinking: true,
    directBlocked: false,
    thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}},
    endpoints: [
      { label: "Default", url: "https://api.siliconflow.cn/v1/chat/completions", baseUrl: "https://api.siliconflow.cn/v1" },
    ],
    models: [
      { id: "deepseek-ai/DeepSeek-V4-Flash", name: "DeepSeek V4 Flash", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "deepseek-ai/DeepSeek-V4-Pro", name: "DeepSeek V4 Pro", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "Pro/moonshotai/Kimi-K2.6", name: "Kimi K2.6 (Pro)", thinking: true, thinkingWire: {"off":{"thinking":{"type":"disabled"}},"low":{"thinking":{"type":"enabled"}},"medium":{"thinking":{"type":"enabled"}},"high":{"thinking":{"type":"enabled"}}} },
      { id: "zai-org/GLM-5.2", name: "GLM-5.2" },
      { id: "Pro/zai-org/GLM-5.1", name: "GLM-5.1 (Pro)" },
    ],
  },
  {
    key: "atlascloud",
    label: "Atlas Cloud",
    category: "aggregator",
    protocol: "openai",
    docs: "https://www.atlascloud.ai/docs",
    apiKeyUrl: "https://www.atlascloud.ai/console/api-keys",
    defaultModel: "deepseek-ai/deepseek-v4-flash",
    canDisableThinking: true,
    directBlocked: false,
    endpoints: [
      { label: "Default", url: "https://api.atlascloud.ai/v1/chat/completions", baseUrl: "https://api.atlascloud.ai/v1" },
    ],
    models: [
      { id: "deepseek-ai/deepseek-v4-flash", name: "DeepSeek V4 Flash" },
      { id: "zai-org/glm-5.2", name: "GLM-5.2" },
      { id: "qwen/qwen3.8-max", name: "Qwen3.8 Max" },
    ],
  },
  {
    key: "nvidia",
    label: "Nvidia NIM",
    category: "aggregator",
    protocol: "openai",
    docs: "https://build.nvidia.com/explore/discover",
    apiKeyUrl: "https://build.nvidia.com/",
    defaultModel: "deepseek-ai/deepseek-v4-flash-0731",
    canDisableThinking: true,
    directBlocked: true,
    endpoints: [
      { label: "NVIDIA NIM", url: "https://integrate.api.nvidia.com/v1/chat/completions", baseUrl: "https://integrate.api.nvidia.com/v1" },
    ],
    models: [
      { id: "deepseek-ai/deepseek-v4-flash-0731", name: "DeepSeek V4 Flash" },
      { id: "nvidia/nemotron-3-ultra-550b-a55b", name: "Nemotron 3 Ultra 550B" },
      { id: "z-ai/glm-5.2", name: "GLM-5.2" },
      { id: "openai/gpt-oss-120b", name: "GPT-OSS 120B" },
      { id: "google/gemma-4-31b-it", name: "Gemma 4 31B IT" },
      { id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron Super 120B" },
      { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct" },
      { id: "meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct" },
    ],
  },
  {
    key: "azureopenai",
    label: "Azure OpenAI",
    category: "aggregator",
    protocol: "azure-openai",
    docs: "https://learn.microsoft.com/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure",
    defaultModel: "gpt-5.4-mini",
    canDisableThinking: true,
    directBlocked: false,
    endpoints: [
    ],
    models: [
      { id: "gpt-5.6-sol", name: "GPT-5.6 Sol", thinking: true },
      { id: "gpt-5.6-terra", name: "GPT-5.6 Terra", thinking: true },
      { id: "gpt-5.6-luna", name: "GPT-5.6 Luna", thinking: true },
      { id: "gpt-chat-latest", name: "GPT-chat-latest", thinking: true },
      { id: "gpt-5.5", name: "GPT-5.5", thinking: true },
      { id: "gpt-5.4", name: "GPT-5.4", thinking: true },
      { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", thinking: true },
      { id: "gpt-5.4-nano", name: "GPT-5.4 Nano", thinking: true },
    ],
  },
  {
    key: "llm",
    label: "Custom (OpenAI-compatible)",
    category: "aggregator",
    protocol: "openai",
    canDisableThinking: true,
    directBlocked: false,
    keyOptional: true,
    endpoints: [
      { label: "LM Studio", url: "http://127.0.0.1:1234/v1/chat/completions", baseUrl: "http://127.0.0.1:1234/v1", docs: "https://lmstudio.ai/docs/developer/openai-compat" },
      { label: "Ollama", url: "http://127.0.0.1:11434/v1/chat/completions", baseUrl: "http://127.0.0.1:11434/v1", docs: "https://docs.ollama.com/api/openai-compatibility" },
      { label: "llama.cpp", url: "http://127.0.0.1:8080/v1/chat/completions", baseUrl: "http://127.0.0.1:8080/v1", docs: "https://github.com/ggml-org/llama.cpp/tree/master/tools/server" },
      { label: "LiteLLM", url: "http://127.0.0.1:4000/v1/chat/completions", baseUrl: "http://127.0.0.1:4000/v1", docs: "https://docs.litellm.ai/docs/" },
      { label: "Together AI", url: "https://api.together.xyz/v1/chat/completions", baseUrl: "https://api.together.xyz/v1", docs: "https://docs.together.ai/docs/inference/openai-compatibility" },
      { label: "Fireworks AI", url: "https://api.fireworks.ai/inference/v1/chat/completions", baseUrl: "https://api.fireworks.ai/inference/v1", docs: "https://docs.fireworks.ai/tools-sdks/openai-compatibility" },
    ],
    models: [
    ],
  },
] as const;

export const findProvider = (key: string): CatalogProvider | undefined => PROVIDER_CATALOG.find((p) => p.key === key);
