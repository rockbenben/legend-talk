import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '../utils/persistStorage';
import { getAdapter, migrateModelId } from '../adapters/registry';
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
      defaultProvider: 'deepseek',
      defaultModel: 'deepseek-v4-flash',
      modelByProvider: {},
      thinkingByProvider: {},
      language: navigator.language || 'en',
      theme: 'light',
      corsProxy: 'https://cors.api2026.workers.dev',
      corsEnabled: { volcengine: true, alibaba: true },
      customBaseUrl: '',
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
      // Bumped to 1 to reconcile stored model ids against catalog renames/removals.
      // Runs once for pre-version state (treated as v0): a returning user who had
      // picked e.g. claude-opus-4-7 or gpt-5.4 would otherwise POST a dead SKU and
      // 400 on their next message. Remap is exact-match only, so custom SKUs survive.
      version: 1,
      migrate: (persisted, version) => {
        const s = persisted as Partial<SettingsState>;
        if (s && typeof s === 'object' && version < 1) {
          if (typeof s.defaultModel === 'string') s.defaultModel = migrateModelId(s.defaultModel) as string;
          if (s.modelByProvider && typeof s.modelByProvider === 'object') {
            for (const k of Object.keys(s.modelByProvider)) {
              s.modelByProvider[k] = migrateModelId(s.modelByProvider[k]) as string;
            }
          }
        }
        return s as SettingsState;
      },
    },
  ),
);
