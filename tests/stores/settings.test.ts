import { useSettingsStore, PROVIDER_KEYED_FIELDS } from '../../src/stores/settings';
import { MODEL_ID_MIGRATIONS, PROVIDER_ID_MIGRATIONS, PROXY_BY_DEFAULT, getAdapter, migrateModelId } from '../../src/adapters/registry';

beforeEach(() => {
  useSettingsStore.setState(useSettingsStore.getInitialState());
  localStorage.clear();
});

describe('settingsStore', () => {
  it('has correct default values', () => {
    const state = useSettingsStore.getState();
    expect(state.apiKeys).toEqual({});
    expect(state.defaultProvider).toBe('deepseek');
    expect(state.defaultModel).toBe('deepseek-v4-flash');
    expect(state.theme).toBe('light');
    expect(state.corsProxy).toBe('https://cors.api2026.workers.dev');
  });

  it('sets and retrieves API key', () => {
    useSettingsStore.getState().setApiKey('openai', 'sk-test-123');
    expect(useSettingsStore.getState().apiKeys.openai).toBe('sk-test-123');
  });

  it('sets default provider and model', () => {
    useSettingsStore.getState().setDefaultProvider('claude');
    useSettingsStore.getState().setDefaultModel('claude-sonnet-4-20250514');
    expect(useSettingsStore.getState().defaultProvider).toBe('claude');
    expect(useSettingsStore.getState().defaultModel).toBe('claude-sonnet-4-20250514');
  });

  it('toggles theme', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
    useSettingsStore.getState().setTheme('light');
    expect(useSettingsStore.getState().theme).toBe('light');
  });

  it('sets CORS proxy', () => {
    useSettingsStore.getState().setCorsProxy('https://proxy.example.com');
    expect(useSettingsStore.getState().corsProxy).toBe('https://proxy.example.com');
  });

  it('clears all API keys', () => {
    useSettingsStore.getState().setApiKey('openai', 'sk-1');
    useSettingsStore.getState().setApiKey('claude', 'sk-2');
    useSettingsStore.getState().clearApiKeys();
    expect(useSettingsStore.getState().apiKeys).toEqual({});
  });

  it('has correct default thinkingLevel', () => {
    const state = useSettingsStore.getState();
    expect(state.thinkingLevel).toBe('off');
  });

  it('setThinkingLevel works for all values', () => {
    const levels: Array<'off' | 'low' | 'medium' | 'high'> = ['off', 'low', 'medium', 'high'];
    for (const level of levels) {
      useSettingsStore.getState().setThinkingLevel(level);
      expect(useSettingsStore.getState().thinkingLevel).toBe(level);
    }
  });

  describe('per-provider memory', () => {
    it('restores the last model chosen on each provider when switching back', () => {
      const s = () => useSettingsStore.getState();
      s().setDefaultModel('deepseek-v4-pro');
      s().setDefaultProvider('claude');
      s().setDefaultModel('claude-sonnet-5');
      s().setDefaultProvider('deepseek');
      expect(s().defaultModel).toBe('deepseek-v4-pro');
      s().setDefaultProvider('claude');
      expect(s().defaultModel).toBe('claude-sonnet-5');
    });

    it('falls back to the first catalog model on first visit to a provider', () => {
      useSettingsStore.getState().setDefaultProvider('zhipu');
      expect(useSettingsStore.getState().defaultModel).toBe('glm-5.3');
    });

    it('snapshots legacy active model even if it was never set through the setter', () => {
      // Simulates state persisted before the memory maps existed.
      useSettingsStore.setState({ defaultProvider: 'openai', defaultModel: 'gpt-5.6-luna', modelByProvider: {} });
      const s = () => useSettingsStore.getState();
      s().setDefaultProvider('claude');
      s().setDefaultProvider('openai');
      expect(s().defaultModel).toBe('gpt-5.6-luna');
    });

    it('remembers thinking level per provider, inheriting on first visit', () => {
      const s = () => useSettingsStore.getState();
      s().setThinkingLevel('high');
      s().setDefaultProvider('claude');
      expect(s().thinkingLevel).toBe('high'); // first visit inherits
      s().setThinkingLevel('off');
      s().setDefaultProvider('deepseek');
      expect(s().thinkingLevel).toBe('high');
      s().setDefaultProvider('claude');
      expect(s().thinkingLevel).toBe('off');
    });

    it('mergeProviderMemory merges without touching active values', () => {
      const s = () => useSettingsStore.getState();
      s().setDefaultModel('deepseek-v4-pro');
      s().mergeProviderMemory({ openai: 'gpt-5.6' }, { openai: 'medium' });
      expect(s().defaultModel).toBe('deepseek-v4-pro');
      expect(s().modelByProvider.openai).toBe('gpt-5.6');
      s().setDefaultProvider('openai');
      expect(s().defaultModel).toBe('gpt-5.6');
      expect(s().thinkingLevel).toBe('medium');
    });

    // Regression: applyConfig must merge imported memory AFTER the provider switch,
    // else setDefaultProvider's snapshot of the pre-import active model clobbers the
    // imported value for the device's currently-active provider. This models that
    // correct order (switch away from deepseek, then merge deepseek's imported model).
    it('imported memory for the pre-import active provider survives the switch snapshot', () => {
      const s = () => useSettingsStore.getState();
      // Local device: on deepseek with deepseek-v4-flash active.
      expect(s().defaultProvider).toBe('deepseek');
      expect(s().defaultModel).toBe('deepseek-v4-flash');
      // applyConfig order: switch provider + set active model FIRST …
      s().setDefaultProvider('openai');
      s().setDefaultModel('gpt-5.6');
      // … then merge imported per-provider memory LAST.
      s().mergeProviderMemory({ deepseek: 'deepseek-v4-pro', openai: 'gpt-5.6' }, {});
      // Switching back to deepseek must show the imported model, not the local one.
      s().setDefaultProvider('deepseek');
      expect(s().defaultModel).toBe('deepseek-v4-pro');
    });
  });

  it('PROVIDER_KEYED_FIELDS 与 store 上真正以 provider id 为键的表一致', () => {
    const s = useSettingsStore.getInitialState() as unknown as Record<string, unknown>;
    // ① 列出来的必须真的存在且是对象 —— 手写字段名错过一次（providerBaseUrl）
    for (const f of PROVIDER_KEYED_FIELDS) {
      expect(s[f], `${f} 不在 store 上`).toBeTypeOf('object');
    }
    // ② store 上以 provider id 为键的表不能有漏网的：默认值里带 provider 键的
    //    只有 corsEnabled，其余默认空对象，所以这里按「Record 型字段」反查。
    const recordFields = Object.keys(s).filter(
      (k) => s[k] !== null && typeof s[k] === 'object' && !Array.isArray(s[k]),
    );
    expect(new Set(recordFields)).toEqual(new Set(PROVIDER_KEYED_FIELDS));
  });

  describe('model id migration', () => {
    it('migrateModelId remaps known renamed ids and passes through the rest', () => {
      expect(migrateModelId('claude-opus-4-7')).toBe('claude-opus-5');
      expect(migrateModelId('claude-sonnet-4-6')).toBe('claude-sonnet-5');
      expect(migrateModelId('mistral-small-4')).toBe('mistral-small-latest');
      expect(migrateModelId('hunyuan-turbos-latest')).toBe('hy3');
      // Unknown / custom SKUs untouched.
      expect(migrateModelId('deepseek-v4-flash')).toBe('deepseek-v4-flash');
      expect(migrateModelId('my-self-hosted-model')).toBe('my-self-hosted-model');
    });

    it('every migration target differs from its source (no identity entries)', () => {
      for (const [from, to] of Object.entries(MODEL_ID_MIGRATIONS)) {
        expect(to).not.toBe(from);
      }
    });

    it('remaps bare and aggregator-prefixed ids independently (no collision)', () => {
      // The bare provider id survives; only the prefixed aggregator id is retired.
      expect(migrateModelId('gemini-3.5-flash')).toBe('gemini-3.5-flash'); // still a live Gemini SKU
      expect(migrateModelId('google/gemini-3.5-flash')).toBe('google/gemini-3.7-flash'); // OpenRouter, retired
    });
  });
  // provider 被删 / 被并进别家时,存档里的 defaultProvider 会指向一个
  // getAdapter 解析不出的 id。那不是「下拉里少一项」,而是【设置面板整块塌掉】:
  // currentAdapter 为 undefined,地址框、模型下拉、文档链接全都不渲染,用户看到
  // 的是那一栏凭空消失,而且 resolveProvider 返回 null,一句话都发不出去。
  describe('存档迁移', () => {
    // 迁移已经合并成一趟，version 不再参与任何判断；这里传 0 只是为了对上签名。
    const migrate = (persisted: Record<string, unknown>) =>
      (useSettingsStore.persist.getOptions().migrate as (s: unknown, v: number) => Record<string, unknown>)(persisted, 0);

    it('并进 Custom 的那家：落到 llm，key 与地址都不丢', () => {
      const out = migrate({
        defaultProvider: 'litellm',
        apiKeys: { litellm: 'sk-master' },
        modelByProvider: { litellm: 'claude-sonnet-5' },
        baseUrlByProvider: { litellm: 'https://gw.example/v1' },
      });
      expect(out.defaultProvider, '落在解析不出的 id 上会让设置面板整块塌掉').toBe('llm');
      expect((out.apiKeys as Record<string, string>).llm).toBe('sk-master');
      expect((out.apiKeys as Record<string, string>).litellm).toBeUndefined();
      expect((out.modelByProvider as Record<string, string>).llm).toBe('claude-sonnet-5');
      // ⚠ Custom 读的是 customBaseUrl，不是 baseUrlByProvider —— 只做通用改键的话
      // 用户会落在一个 key 还在、地址却空了的 Custom 上，照样发不出请求。
      expect(out.customBaseUrl, '地址没搬到 Custom 实际读的字段').toBe('https://gw.example/v1');
    });

    it('没存过覆盖地址时用它当初的默认地址，不留空', () => {
      const out = migrate({ defaultProvider: 'litellm', apiKeys: { litellm: 'sk-x' } });
      expect(out.defaultProvider).toBe('llm');
      expect(out.customBaseUrl).toBe('http://127.0.0.1:4000/v1');
    });

    it('用户已经填过 Custom 地址就不覆盖它', () => {
      const out = migrate({ defaultProvider: 'litellm', customBaseUrl: 'https://mine/v1', baseUrlByProvider: { litellm: 'https://gw/v1' } });
      expect(out.customBaseUrl).toBe('https://mine/v1');
    });

    // 反方向：迁移表【没写】的删除也不能留下空面板。这条是通用兜底，将来再删
    // provider 而忘了写迁移，最坏也只是回到默认服务商。
    it('迁移表里没有的死 id 也不会留在空里', () => {
      const out = migrate({ defaultProvider: 'some-retired-provider' });
      expect(out.defaultProvider).toBe('deepseek');
      expect(out.defaultModel).toBeTruthy();
    });

    it('活着的 provider 不受影响', () => {
      const out = migrate({ defaultProvider: 'openai', defaultModel: 'gpt-5.6' });
      expect(out.defaultProvider).toBe('openai');
    });

    // 回归：兜底那步一旦排在改名之前，改过名的 provider 在改名前同样「解析不出」，
    // 会被一把推回默认服务商 —— key 还在，人却不在那儿了，而且只认 litellm 的地址
    // 抢救也跟着跳过。迁移合并成一趟之前，这是真实行为。
    it('改过名的 provider 走迁移，不是被推回默认服务商', () => {
      const out = migrate({ defaultProvider: 'litellm', baseUrlByProvider: { litellm: 'https://gw/v1' } });
      expect(out.defaultProvider, '兜底排在改名前会把人推回 deepseek').toBe('llm');
      expect(out.customBaseUrl, '被推回默认服务商之后，只认 litellm 的那段地址抢救就跳过了').toBe('https://gw/v1');
    });

    // 改名会接龙：当年 4-7 → 4-8，今天 4-8 → 5。整张表每次都重跑，不能假设「迁过
    // 一次就到位了」。
    it('已经迁过一次的型号继续往下迁', () => {
      const out = migrate({ defaultModel: 'claude-opus-4-8', modelByProvider: { zhipu: 'glm-4.6' } });
      expect(out.defaultModel, '停在死 SKU 上，下一句话就 400，界面上没有任何解释').toBe('claude-opus-5');
      expect((out.modelByProvider as Record<string, string>).zhipu).toBe('glm-5.2');
    });

    // persist 是【整个对象替换】，初始 state 里那份 PROXY_BY_DEFAULT 只有全新安装
    // 拿得到 —— 不在迁移里回填，老用户就会直连一个本来就不通的域名。
    it('新增的 directBlocked 家，老存档也拿得到默认代理开关', () => {
      const out = migrate({ corsEnabled: { volcengine: false } });
      const cors = out.corsEnabled as Record<string, boolean>;
      for (const k of Object.keys(PROXY_BY_DEFAULT)) {
        if (k === 'volcengine') continue;
        expect(cors[k], `${k} 直连不通，没拿到默认开关就是一条光秃秃的网络错误`).toBe(true);
      }
      expect(cors.volcengine, '用户显式关过的不能被默认值盖回去').toBe(false);
    });

    it('迁移表两条不变量：target 活着、key 已死', () => {
      for (const [from, to] of Object.entries(PROVIDER_ID_MIGRATIONS)) {
        expect(getAdapter(to), `${from} → ${to}：target 必须是活着的 provider`).toBeDefined();
        expect(getAdapter(from), `${from} 仍然是活着的 provider，不该出现在迁移表里`).toBeUndefined();
      }
    });
  });
});
