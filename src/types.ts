export interface Character {
  id: string;
  domain: string[];
  avatar: string;
  color: string;
  systemPrompt: string;
}

export type ThinkingLevel = 'off' | 'low' | 'medium' | 'high';

/** 各档位该往请求体里合并的字段。缺档位键 = 该档位不发任何参数。 */
export type ThinkingWire = Partial<Record<ThinkingLevel, Record<string, unknown>>>;

export interface ModelOption {
  id: string;
  name: string;
  /**
   * 该 SKU 的思考参数线格式。缺省 = 不发任何思考参数（已知不思考，或这家没有
   * 已知的线格式 —— 两种都不该乱发）。缺 'off' 键 = 关闭态也不发，厂商没有关闭
   * 值时由最低档承担。
   *
   * 逐 SKU 而不是逐 provider：同一家的形态可以不同（Kimi K3 收顶层
   * reasoning_effort，K2.x 收 thinking:{type}），一个 provider 一种形态表达不了 ——
   * 上一版就是靠 modelOverrides 打补丁绕过去的。
   */
  thinkingWire?: ThinkingWire;
}

export interface ChatParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  model: string;
  apiKey: string;
  corsProxy?: string;
  thinkingLevel?: ThinkingLevel;
  signal?: AbortSignal;
}

/** A provider-official host the user can switch to — regional variants
 *  (mainland / international) or billing variants (pay-as-you-go / token plan).
 *  `endpoints[0].url` must equal the adapter's own `baseUrl` so the default
 *  reads as "selected" without storing anything. */
export interface EndpointOption {
  label: string;
  url: string;
}

export interface LLMAdapter {
  id: string;
  name: string;
  models: ModelOption[];
  docsUrl?: string;
  apiKeyUrl?: string;
  group?: string;
  /**
   * 这个 SKU 有没有已知的思考形态 —— 界面据此决定要不要显示思考控件。
   * 省略 = 恒为真（claude 原生适配器：它对任何在册或手填的型号都算得出形态）。
   */
  supportsThinking?(model: string): boolean;
  /**
   * 当前打的地址，与 withBaseUrl 配套。两者【与中转开关正交】：这里决定打哪个
   * 地址，中转只决定走不走那一跳 —— 用户既可以「官方地址 + 走中转」，也可以
   * 「自建网关 + 直连」。逃生口发给每一家而不是逐个手发：谁会被上游按 origin
   * 拦无法预判，手发必然漏掉最需要它的人。
   */
  baseUrl?: string;
  withBaseUrl?(url: string): LLMAdapter;
  /** 官方端点变体（地域 / 计费线）。少于两条时界面不渲染选择行。 */
  endpoints?: EndpointOption[];
  chat(params: ChatParams): AsyncGenerator<string>;
}

export interface Message {
  id: string;
  role: 'user' | 'character';
  characterId?: string;
  content: string;
  timestamp: number;
  /**
   * For chair intervention messages (role: 'user' past the first), the focus card
   * content that existed at the moment this message was sent. Retry uses it to
   * rebuild the focus card as `focusSnapshot + this.content`, preserving the
   * chair's focus edits up to (but not including) this intervention.
   */
  focusSnapshot?: string;
}

export interface Conversation {
  id: string;
  type: 'single' | 'roundtable';
  title?: string;
  templateId?: string;
  characters: string[];
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  apiKeys: Record<string, string>;
  defaultProvider: string;
  defaultModel: string;
  language: string;
  theme: 'light' | 'dark';
  corsProxy: string;
  thinkingLevel: ThinkingLevel;
}
