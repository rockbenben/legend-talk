import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '../utils/persistStorage';
import { getAdapter, migrateModelId, PROVIDER_ID_MIGRATIONS, PROXY_BY_DEFAULT } from '../adapters/registry';

/** Ships as the default, and the landing spot when a provider is retired. */
const FALLBACK_PROVIDER = 'deepseek';

/**
 * 每一张【以 provider id 为键】的表。provider 改名时必须全部一起改键，漏掉一张
 * 就会把用户配好的东西留在读不到的旧键下（漏 apiKeys 表现为 key 凭空消失）。
 * 具名导出是为了让测试能核对它与 store 实际字段一致 —— 手写字段名错过一次
 * （写成了并不存在的 providerBaseUrl，编译期不报错，运行期静默漏迁一张表）。
 */
export const PROVIDER_KEYED_FIELDS = ['apiKeys', 'modelByProvider', 'thinkingByProvider', 'corsEnabled', 'baseUrlByProvider'] as const;
import type { Character, ThinkingLevel } from '../types';

/** Stored custom character — includes display name + era for i18n injection */
export interface CustomCharacter extends Character {
  displayName: string;
  era?: string;
}

interface SettingsState {
  apiKeys: Record<string, string>;
  defaultProvider: string;
  /** Active model/thinking for the CURRENT provider — what resolveProvider consumes. */
  defaultModel: string;
  /** Per-provider memory: last model / thinking level chosen on each provider.
   *  Maintained by the setters; setDefaultProvider restores from here on switch. */
  modelByProvider: Record<string, string>;
  thinkingByProvider: Record<string, ThinkingLevel>;
  language: string;
  theme: 'light' | 'dark';
  corsProxy: string;
  corsEnabled: Record<string, boolean>;
  customBaseUrl: string;
  /** Per-provider host override — a regional endpoint the user picked from the
   *  adapter's list, or a gateway they typed. Empty/absent = the adapter's own
   *  default. Every OpenAI-compatible provider gets one: which upstream blocks a
   *  browser is not predictable, so an escape hatch handed out per-provider by
   *  hand is one someone will be missing when they need it. */
  baseUrlByProvider: Record<string, string>;
  thinkingLevel: 'off' | 'low' | 'medium' | 'high';
  roundtableRounds: number;
  shareCardEndpoint: string;
  favoriteCharacters: string[];
  customCharacters: CustomCharacter[];
  setApiKey: (provider: string, key: string) => void;
  setDefaultProvider: (provider: string) => void;
  setDefaultModel: (model: string) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCorsProxy: (proxy: string) => void;
  setCorsEnabled: (provider: string, enabled: boolean) => void;
  setCustomBaseUrl: (url: string) => void;
  setProviderBaseUrl: (provider: string, url: string) => void;
  setThinkingLevel: (level: 'off' | 'low' | 'medium' | 'high') => void;
  setRoundtableRounds: (rounds: number) => void;
  setShareCardEndpoint: (url: string) => void;
  /** Merge imported per-provider memory (settings sync) without touching active values. */
  mergeProviderMemory: (models: Record<string, string>, thinking: Record<string, ThinkingLevel>) => void;
  toggleFavorite: (characterId: string) => void;
  clearApiKeys: () => void;
  saveCustomCharacter: (char: CustomCharacter) => void;
  deleteCustomCharacter: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {},
      defaultProvider: FALLBACK_PROVIDER,
      defaultModel: 'deepseek-v4-flash',
      modelByProvider: {},
      thinkingByProvider: {},
      language: navigator.language || 'en',
      theme: 'light',
      corsProxy: 'https://cors.api2026.workers.dev',
      // 哪几家默认走代理由 PROXY_BY_DEFAULT 决定（大部分从 provider 目录的
      // directBlocked 派生），不在这里手抄一份。
      corsEnabled: { ...PROXY_BY_DEFAULT },
      customBaseUrl: '',
      baseUrlByProvider: {},
      thinkingLevel: 'off' as const,
      roundtableRounds: 2,
      shareCardEndpoint: '',
      favoriteCharacters: [],
      customCharacters: [],
      setApiKey: (provider, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
      setDefaultProvider: (provider) =>
        set((s) => {
          if (provider === s.defaultProvider) return {};
          return {
            defaultProvider: provider,
            // Snapshot the outgoing provider's active choices (covers state
            // persisted before the memory maps existed), then restore the
            // incoming provider's. First visit falls back to its first catalog
            // model; thinking level carries over unchanged.
            modelByProvider: { ...s.modelByProvider, [s.defaultProvider]: s.defaultModel },
            thinkingByProvider: { ...s.thinkingByProvider, [s.defaultProvider]: s.thinkingLevel },
            defaultModel: s.modelByProvider[provider] ?? getAdapter(provider)?.models[0]?.id ?? '',
            thinkingLevel: s.thinkingByProvider[provider] ?? s.thinkingLevel,
          };
        }),
      setDefaultModel: (defaultModel) =>
        set((s) => ({ defaultModel, modelByProvider: { ...s.modelByProvider, [s.defaultProvider]: defaultModel } })),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setCorsProxy: (corsProxy) => set({ corsProxy }),
      setCorsEnabled: (provider, enabled) =>
        set((s) => ({ corsEnabled: { ...s.corsEnabled, [provider]: enabled } })),
      setCustomBaseUrl: (customBaseUrl) => set({ customBaseUrl }),
      setProviderBaseUrl: (provider, url) =>
        set((s) => ({ baseUrlByProvider: { ...s.baseUrlByProvider, [provider]: url } })),
      setThinkingLevel: (thinkingLevel) =>
        set((s) => ({ thinkingLevel, thinkingByProvider: { ...s.thinkingByProvider, [s.defaultProvider]: thinkingLevel } })),
      setRoundtableRounds: (roundtableRounds) => set({ roundtableRounds }),
      setShareCardEndpoint: (shareCardEndpoint) => set({ shareCardEndpoint }),
      mergeProviderMemory: (models, thinking) =>
        set((s) => ({
          modelByProvider: { ...s.modelByProvider, ...models },
          thinkingByProvider: { ...s.thinkingByProvider, ...thinking },
        })),
      toggleFavorite: (characterId) =>
        set((s) => ({
          favoriteCharacters: s.favoriteCharacters.includes(characterId)
            ? s.favoriteCharacters.filter((id) => id !== characterId)
            : [...s.favoriteCharacters, characterId],
        })),
      clearApiKeys: () => set({ apiKeys: {} }),
      saveCustomCharacter: (char) =>
        set((s) => ({
          customCharacters: s.customCharacters.some((c) => c.id === char.id)
            ? s.customCharacters.map((c) => (c.id === char.id ? char : c))
            : [...s.customCharacters, char],
        })),
      deleteCustomCharacter: (id) =>
        set((s) => ({ customCharacters: s.customCharacters.filter((c) => c.id !== id) })),
    }),
    {
      name: 'legend-talk-settings',
      storage: createJSONStorage(() => persistStorage),
      // ⚠ 加迁移条目 = 【必须 bump version】。zustand 只在「存档版本 ≠ 这里的
      // version」时才调 migrate，版本一致就整个跳过。所以往 MODEL_ID_MIGRATIONS /
      // PROVIDER_ID_MIGRATIONS / PROXY_BY_DEFAULT 里加东西却不动这个数字，等于没加：
      // 已经停在当前版本的人一辈子跑不到。
      //
      // 下面【不再按版本分段】。分段只有在「同一份数据要按存档年代做不同处理」时才
      // 有意义，这里四步对任何年代的存档都是同一套，而且每一步都幂等（改名表的旧 id
      // 已经不是活着的 provider，型号表精确匹配且 target 必活，默认开关只填没碰过的
      // 键）。分段反而出过事：兜底那步曾经挂在改名【之前】的一个版本段上，于是改过名
      // 的 provider 在改名前就被判成解析不出，一把推回默认服务商。
      // 顺序才是唯一要紧的东西，写在各步注释里。
      version: 2,
      migrate: (persisted) => {
        const s = persisted as Partial<SettingsState>;
        if (!s || typeof s !== 'object') return s as SettingsState;

        // 1. provider id 统一成目录 key。id 是分存 API key / baseUrl / CORS 开关
        // 的键，所以几张表要一起改键，只改 defaultProvider 会把用户配好的 key 留在
        // 一个再也读不到的旧键下。
        //
        // ⚠ 地址要【单独】搬一次：并进 Custom 的那几家（litellm）原本把地址存在
        // baseUrlByProvider 里，而 Custom 读的是 customBaseUrl —— 只做通用改键，
        // 用户会落在一个 key 还在、地址却空了的 Custom 上，照样发不出请求。
        // 没存过覆盖地址就用它当初的默认地址，别留空。
        if (s.defaultProvider === 'litellm' && !s.customBaseUrl) {
          s.customBaseUrl = s.baseUrlByProvider?.litellm?.trim() || 'http://127.0.0.1:4000/v1';
        }
        if (typeof s.defaultProvider === 'string') {
          s.defaultProvider = PROVIDER_ID_MIGRATIONS[s.defaultProvider] ?? s.defaultProvider;
        }
        for (const field of PROVIDER_KEYED_FIELDS) {
          const m = s[field];
          if (!m || typeof m !== 'object') continue;
          for (const [from, to] of Object.entries(PROVIDER_ID_MIGRATIONS)) {
            if (from in m && !(to in m)) {
              m[to] = m[from];
              delete m[from];
            }
          }
        }

        // 2. 型号改名：存档里留着一个退役 SKU，下一句话就 400，界面上没有任何解释。
        // 改名会接龙（4-7 → 4-8 → 5），所以每次都重跑整张表，不能假设「迁过一次就
        // 到位了」。
        if (typeof s.defaultModel === 'string') s.defaultModel = migrateModelId(s.defaultModel) as string;
        if (s.modelByProvider && typeof s.modelByProvider === 'object') {
          for (const k of Object.keys(s.modelByProvider)) {
            s.modelByProvider[k] = migrateModelId(s.modelByProvider[k]) as string;
          }
        }

        // 3. 代理默认开关：persist 是【整个对象替换】，初始 state 里那份
        // PROXY_BY_DEFAULT 只有全新安装拿得到。老用户存档里没有后来新增的
        // directBlocked 家，于是直连一个本来就不通的域名，只看到一条光秃秃的网络
        // 错误 —— 那张表从目录派生出来，正是为了防这个。用户显式关过的保持关（存的
        // 是 false，覆盖在默认之上），只有【没碰过】的键才吃默认。
        // ⚠ 必须排在 1 之后：默认值用的是新 id，先铺会让上面的 `!(to in m)` 判假，
        // 把用户显式设过的那一条丢掉。
        s.corsEnabled = { ...PROXY_BY_DEFAULT, ...s.corsEnabled };

        // 4. 落空兜底：defaultProvider 停在一个解析不出的 id 上，界面不是「少一项」
        // 而是【整块塌掉】—— currentAdapter 为 undefined，地址框、模型下拉、文档链接
        // 全都不渲染，用户看到的是那一栏凭空消失。第 1 步负责【搬到对的地方】（保住
        // key 与地址），这一步只负责「无论如何都别落在空里」：将来再删 / 并 provider
        // 而忘了写迁移，最坏也只是回到默认服务商，而不是一个点不动的空面板。
        // ⚠ 必须排在 1 之后：改过名的 id 在改名【之前】看起来同样是「解析不出」，
        // 先跑就把人一把推回默认服务商，改名表再没机会执行 —— 顺带把上面那段只认
        // litellm 的地址抢救也一起跳过。
        if (typeof s.defaultProvider === 'string' && !getAdapter(s.defaultProvider)) {
          s.defaultProvider = FALLBACK_PROVIDER;
          s.defaultModel = getAdapter(FALLBACK_PROVIDER)?.models[0]?.id ?? '';
        }
        return s as SettingsState;
      },
    },
  ),
);
