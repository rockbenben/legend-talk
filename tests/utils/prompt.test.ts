import { getLangInstruction, buildSystemPrompt, ROUNDTABLE_SUFFIX, resolveProvider, isProviderConfigured, probeConnection, DEFAULT_CORS_PROXY } from '../../src/utils/prompt';
import { useSettingsStore } from '../../src/stores/settings';
import * as registry from '../../src/adapters/registry';
import { PROVIDER_CATALOG } from '../../src/adapters/providerCatalog.generated';
import { OpenAICompatibleAdapter } from '../../src/adapters/openai-compatible';

beforeEach(() => {
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('getLangInstruction', () => {
  it('returns Chinese instruction for "zh"', () => {
    expect(getLangInstruction('zh')).toBe(' Always respond in Simplified Chinese (简体中文).');
  });

  it('returns English instruction for "en"', () => {
    expect(getLangInstruction('en')).toBe(' Always respond in English.');
  });

  it('returns language-specific instruction from i18n for all supported languages', () => {
    const expected: Record<string, string> = {
      'zh': 'Simplified Chinese (简体中文)',
      'zh-Hant': 'Traditional Chinese (繁體中文)',
      'en': 'English',
      'ja': 'Japanese (日本語)',
      'ko': 'Korean (한국어)',
    };
    for (const [lang, name] of Object.entries(expected)) {
      expect(getLangInstruction(lang)).toBe(` Always respond in ${name}.`);
    }
  });

  it('falls back to English for unknown languages', () => {
    expect(getLangInstruction('xx')).toBe(' Always respond in English.');
  });

  it('settings.language flows through to prompt instruction', () => {
    const langs = ['zh', 'zh-Hant', 'en', 'ja', 'ko'];
    for (const lang of langs) {
      const prompt = buildSystemPrompt('Test prompt.', lang);
      expect(prompt).toContain('Always respond in');
      expect(prompt).not.toContain('undefined');
      expect(prompt).not.toContain('nav.replyLanguage');
    }
  });
});

describe('buildSystemPrompt', () => {
  const directive = ' Skip pleasantries and filler — no "great question", no unnecessary preamble. Get straight to your perspective. Stay on topic.';

  it('concatenates prompt, directive, and lang instruction', () => {
    const result = buildSystemPrompt('You are Socrates.', 'en');
    expect(result).toBe('You are Socrates.' + directive + ' Always respond in English.');
  });

  it('includes suffix when provided', () => {
    const result = buildSystemPrompt('You are Socrates.', 'en', ROUNDTABLE_SUFFIX);
    expect(result).toBe('You are Socrates.' + ROUNDTABLE_SUFFIX + directive + ' Always respond in English.');
  });

  it('uses Chinese instruction when lang is "zh"', () => {
    const result = buildSystemPrompt('You are Socrates.', 'zh');
    expect(result).toBe('You are Socrates.' + directive + ' Always respond in Simplified Chinese (简体中文).');
  });

  it('defaults suffix to empty string', () => {
    const withExplicit = buildSystemPrompt('Prompt.', 'en', '');
    const withDefault = buildSystemPrompt('Prompt.', 'en');
    expect(withExplicit).toBe(withDefault);
  });
});

describe('resolveProvider', () => {
  const mockAdapter = {
    id: 'openai',
    name: 'OpenAI',
    models: [{ id: 'gpt-4o', name: 'GPT-4o' }, { id: 'gpt-4o-mini', name: 'GPT-4o Mini' }],
    chat: vi.fn(),
  };

  it('returns null when adapter is not found', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(undefined);
    expect(resolveProvider()).toBeNull();
  });

  it('returns null when API key is missing', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    // No API key set — apiKeys is empty by default
    expect(resolveProvider()).toBeNull();
  });

  it('returns provider object when adapter and key exist', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');

    const result = resolveProvider();
    expect(result).not.toBeNull();
    expect(result!.adapter).toBe(mockAdapter);
    expect(result!.apiKey).toBe('sk-test');
  });

  it('points the adapter at a per-provider endpoint override', () => {
    const real = new OpenAICompatibleAdapter(
      'openai', 'OpenAI', 'https://api.openai.com/v1',
      [{ id: 'gpt-4o', name: 'GPT-4o' }],
      { docsUrl: 'https://d', group: 'international' },
    );
    vi.spyOn(registry, 'getAdapter').mockReturnValue(real);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setProviderBaseUrl('deepseek', 'https://api.z.ai/api/paas/v4/');

    const adapter = resolveProvider()!.adapter as OpenAICompatibleAdapter;
    // Trailing slash stripped — the CORS proxy 400s on a doubled separator.
    expect(adapter.baseUrl).toBe('https://api.z.ai/api/paas/v4');
    // Everything else is provider identity and must survive the swap.
    expect(adapter.id).toBe('openai');
    expect(adapter.models).toEqual(real.models);
    expect(adapter.docsUrl).toBe('https://d');
    expect(adapter.group).toBe('international');
  });

  it('leaves the adapter untouched when no override is set', () => {
    const real = new OpenAICompatibleAdapter('openai', 'OpenAI', 'https://api.openai.com/v1', []);
    vi.spyOn(registry, 'getAdapter').mockReturnValue(real);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    expect(resolveProvider()!.adapter).toBe(real);
  });

  it('uses settings.defaultModel directly', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setDefaultModel('gpt-4o-mini');

    const result = resolveProvider();
    expect(result!.model).toBe('gpt-4o-mini');
  });

  it('falls back to adapter.models[0] when defaultModel is empty', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setDefaultModel('');

    const result = resolveProvider();
    expect(result!.model).toBe('gpt-4o');
  });

  it('includes language from settings', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');

    const result = resolveProvider();
    expect(result).toHaveProperty('lang');
    expect(result!.lang).toBe(useSettingsStore.getState().language);
  });

  it('includes corsProxy as undefined when empty', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');

    const result = resolveProvider();
    expect(result!.corsProxy).toBeUndefined();
  });

  it('includes corsProxy when enabled for provider', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setCorsProxy('https://proxy.example.com');
    useSettingsStore.getState().setCorsEnabled('deepseek', true);

    const result = resolveProvider();
    expect(result!.corsProxy).toBe('https://proxy.example.com');
  });

  it('strips trailing slashes from corsProxy (proxy 400s on double-slash paths)', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setCorsProxy('https://proxy.example.com//');
    useSettingsStore.getState().setCorsEnabled('deepseek', true);

    const result = resolveProvider();
    expect(result!.corsProxy).toBe('https://proxy.example.com');
  });

  it('excludes corsProxy when not enabled for provider', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setCorsProxy('https://proxy.example.com');
    useSettingsStore.getState().setCorsEnabled('deepseek', false);

    const result = resolveProvider();
    expect(result!.corsProxy).toBeUndefined();
  });
});

describe('自定义 provider（llm）', () => {
  // 回归：provider id 从 'custom' 改名为 'llm' 时，这里的比较漏改，isCustom 恒
  // false —— customBaseUrl 永远不注入，请求打到空地址；而且它反过来开始要求
  // API key、还会被送进 CORS 代理。三条都错，且测试全绿（getAdapter 被 mock 了）。
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
    vi.restoreAllMocks();
  });

  it('注入用户填的 baseUrl，且不强制要 API key', () => {
    const s = useSettingsStore.getState();
    s.setDefaultProvider('llm');
    s.setCustomBaseUrl('https://my-gateway.example/v1');
    const p = resolveProvider();
    expect(p, 'llm 不该因为没有 key 就解析失败').not.toBeNull();
    expect((p!.adapter as OpenAICompatibleAdapter).baseUrl).toBe('https://my-gateway.example/v1');
    expect(p!.adapter.id).toBe('llm');
  });

  it('没填 baseUrl 时解析失败 —— 空地址发不出请求', () => {
    useSettingsStore.getState().setDefaultProvider('llm');
    expect(resolveProvider()).toBeNull();
  });

  it('不走 CORS 代理 —— 自填地址不该被送进声明式白名单的代理', () => {
    const s = useSettingsStore.getState();
    s.setDefaultProvider('llm');
    s.setCustomBaseUrl('https://my-gateway.example/v1');
    s.setCorsEnabled('llm', true);
    expect(resolveProvider()!.corsProxy).toBeUndefined();
  });

  // 判据必须来自目录（keyOptional），不是「是不是 Custom」这种按 id 列的名单 ——
  // 曾经就是按 id 列的，于是同为自建网关的 LiteLLM 被当成普通厂商，没填 key 就
  // 解析失败。这条遍历目录里【全部】keyOptional 成员，将来再多一家自动纳入。
  it('目录里每个「地址即凭据」的服务商都不强制要 key', () => {
    const optional = PROVIDER_CATALOG.filter((p) => p.keyOptional).map((p) => p.key);
    expect(optional.length, '目录里一个都没有，这条测试在空转').toBeGreaterThan(0);
    for (const key of optional) {
      const s = useSettingsStore.getState();
      s.setDefaultProvider(key);
      // 这几家「地址才是凭据」，所以地址得有 —— 唯一的空缺必须是 key
      if (key === 'llm') s.setCustomBaseUrl('https://my-gateway.example/v1');
      else s.setProviderBaseUrl(key, 'https://my-gateway.example/v1');
      expect(resolveProvider(), `${key} 不该因为没有 key 就解析失败`).not.toBeNull();
    }
  });

  it('真要 key 的厂商没被顺手放行', () => {
    useSettingsStore.getState().setDefaultProvider('openai');
    expect(resolveProvider()).toBeNull();
  });
});

describe('probeConnection', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
    vi.restoreAllMocks();
  });

  const provider = (over: Partial<{ chat: unknown }> = {}) => ({
    adapter: { id: 'x', name: 'X', models: [], ...over } as never,
    apiKey: 'k',
    model: 'm',
    lang: 'zh',
    corsProxy: undefined,
    thinkingLevel: 'off' as const,
  });

  it('走的是 chat() —— 与正式请求同一条路径，模型/思考档/代理都照搬', async () => {
    const chat = vi.fn(async function* (_params: Record<string, unknown>) {
      yield 'OK';
    });
    const p = provider({ chat });
    p.corsProxy = 'https://proxy.example' as never;
    await probeConnection(p as never);
    expect(chat).toHaveBeenCalledTimes(1);
    const args = chat.mock.calls[0][0];
    expect(args.model).toBe('m');
    expect(args.apiKey).toBe('k');
    expect(args.corsProxy).toBe('https://proxy.example');
    expect(args.thinkingLevel).toBe('off');
    expect(args.signal).toBeInstanceOf(AbortSignal);
  });

  it('拿到第一个 token 就停 —— 验证链路通不通，不必烧完整回复', async () => {
    let produced = 0;
    const chat = vi.fn(async function* () {
      for (let i = 0; i < 100; i++) {
        produced++;
        yield 'x';
      }
    });
    await probeConnection(provider({ chat }) as never);
    expect(produced).toBe(1);
  });

  it('空回复也算通 —— 请求成功就说明链路没问题', async () => {
    const chat = vi.fn(async function* () {});
    await expect(probeConnection(provider({ chat }) as never)).resolves.toBeUndefined();
  });


  // 耐心是 3 分钟（思考模型第一个可见 token 本来就要等那么久），所以必须给得出
  // 一个取消口 —— 否则界面上就是一个转三分钟、点不动的按钮，只能刷新页面。
  it('外部 signal 能中途取消 —— 这是「停止」按钮的接线', async () => {
    const outer = new AbortController();
    let seen: AbortSignal | undefined;
    const chat = vi.fn(async function* (params: Record<string, unknown>) {
      seen = params.signal as AbortSignal;
      outer.abort();                       // 用户点了「停止」
      await new Promise((r) => setTimeout(r, 0));
      if (seen.aborted) throw new Error('aborted');
      yield 'never';
    });
    await expect(probeConnection(provider({ chat }) as never, undefined, outer.signal)).rejects.toThrow('aborted');
    expect(seen!.aborted, '外部取消必须传导到发给适配器的那个 signal').toBe(true);
  });

  it('已经取消的 signal 传进来也算数，不会白发一次请求', async () => {
    const chat = vi.fn(async function* (params: Record<string, unknown>) {
      expect((params.signal as AbortSignal).aborted, '进来就该是已取消状态').toBe(true);
      yield 'x';
    });
    await probeConnection(provider({ chat }) as never, undefined, AbortSignal.abort());
    expect(chat).toHaveBeenCalledTimes(1);
  });
  it('原样抛出适配器的错误 —— 只回 boolean 会把「key 错」和「地址不通」压成同一句', async () => {
    const chat = vi.fn(async function* (): AsyncGenerator<string> {
      throw new Error('[401] invalid api key');
    });
    await expect(probeConnection(provider({ chat }) as never)).rejects.toThrow('[401] invalid api key');
  });
});

// 地址与中转是【正交】的两轴：地址决定打哪儿，开关决定走不走那一跳。
// 之前地址框只发给 OpenAI 兼容那几家（claude / gemini 拿不到），而中转的适用性
// 是按 provider id 粗判的 —— 两处都不是这两轴该有的形状。
describe('地址与中转两轴正交', () => {
  beforeEach(() => {
    useSettingsStore.setState(useSettingsStore.getInitialState());
    vi.restoreAllMocks();
  });

  it('每一家都能换地址，包括两个原生适配器', () => {
    for (const a of registry.getAllAdapters()) {
      if (a.id === 'llm') continue; // 它的地址走 customBaseUrl 那一栏
      expect(a.withBaseUrl, `${a.id} 没有地址逃生口`).toBeTypeOf('function');
    }
    const s = useSettingsStore.getState();
    s.setDefaultProvider('claude');
    s.setApiKey('claude', 'sk-ant');
    s.setProviderBaseUrl('claude', 'https://my-gw.example/v1/');
    // 尾斜杠要剪掉，否则拼出 //messages
    expect(resolveProvider()!.adapter.baseUrl).toBe('https://my-gw.example/v1');
  });

  it('官方地址 + 内置中转 → 照走中转', () => {
    const s = useSettingsStore.getState();
    s.setDefaultProvider('deepseek');
    s.setApiKey('deepseek', 'sk-d');
    s.setCorsEnabled('deepseek', true);
    expect(resolveProvider()!.corsProxy).toBe(DEFAULT_CORS_PROXY);
  });

  it('自填地址 + 内置中转 → 退回直连（那台按 host 白名单转发，够不着也不放行）', () => {
    const s = useSettingsStore.getState();
    s.setDefaultProvider('deepseek');
    s.setApiKey('deepseek', 'sk-d');
    s.setCorsEnabled('deepseek', true);
    s.setProviderBaseUrl('deepseek', 'https://my-gw.example/v1');
    expect(resolveProvider()!.corsProxy, '自建地址不该被交给第三方公共中转').toBeUndefined();
  });

  it('自填地址 + 自建中转 → 照发（那台归用户所有，白名单他自己声明）', () => {
    const s = useSettingsStore.getState();
    s.setDefaultProvider('deepseek');
    s.setApiKey('deepseek', 'sk-d');
    s.setCorsEnabled('deepseek', true);
    s.setProviderBaseUrl('deepseek', 'https://my-gw.example/v1');
    s.setCorsProxy('https://my-own-proxy.example');
    expect(resolveProvider()!.corsProxy).toBe('https://my-own-proxy.example');
  });

  it('官方【变体】地址仍算官方，中转照走', () => {
    const zhipu = registry.getAdapter('zhipu')!;
    const variant = zhipu.endpoints?.[1]?.url;
    expect(variant, 'zhipu 应有多个官方端点，否则这条在空转').toBeTruthy();
    const s = useSettingsStore.getState();
    s.setDefaultProvider('zhipu');
    s.setApiKey('zhipu', 'sk-z');
    s.setCorsEnabled('zhipu', true);
    s.setProviderBaseUrl('zhipu', variant!);
    expect(resolveProvider()!.corsProxy).toBe(DEFAULT_CORS_PROXY);
  });
});

// 「这家配好了吗」曾经抄成三份（prompt.ts、ChatView、ChatPage）。抄多份的下场
// 是两个闸门各说各话：横幅说未配置、发送却放行（或反过来），而两边都看不出错。
// 现在只有一份，这条测试把它与 resolveProvider 钉在一起。
describe('isProviderConfigured 与 resolveProvider 是同一道闸', () => {
  it('每一家：没配好两边都判否，配好两边都判是', () => {
    for (const a of registry.getAllAdapters()) {
      const keyOptional = !!PROVIDER_CATALOG.find((p) => p.key === a.id)?.keyOptional;
      // 空状态：llm 的凭据是【地址】，其余家的是 key，两者都还没有
      useSettingsStore.setState({ defaultProvider: a.id, apiKeys: {}, customBaseUrl: '', defaultModel: a.models[0]?.id ?? '' });
      const empty = useSettingsStore.getState();
      expect(isProviderConfigured(empty), `${a.id} 空状态`).toBe(keyOptional && a.id !== 'llm');
      expect(!!resolveProvider(), `${a.id} 空状态：resolveProvider 与横幅必须同判`).toBe(isProviderConfigured(empty));
      // 配好
      useSettingsStore.setState({ apiKeys: { [a.id]: 'sk-x' }, customBaseUrl: 'https://gw.example/v1' });
      const filled = useSettingsStore.getState();
      expect(isProviderConfigured(filled), `${a.id} 配好`).toBe(true);
      expect(!!resolveProvider(), `${a.id} 配好：resolveProvider 与横幅必须同判`).toBe(true);
    }
  });

  it('全是空白的 key 不算配好 —— 否则横幅消失而请求带着空 Authorization 发出去', () => {
    useSettingsStore.setState({ defaultProvider: 'deepseek', apiKeys: { deepseek: '   ' }, customBaseUrl: '' });
    expect(isProviderConfigured(useSettingsStore.getState())).toBe(false);
    expect(resolveProvider()).toBeNull();
  });
});
