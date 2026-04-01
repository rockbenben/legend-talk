import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { persistStorage } from '../utils/persistStorage';

interface SettingsState {
  apiKeys: Record<string, string>;
  defaultProvider: string;
  defaultModel: string;
  language: string;
  theme: 'light' | 'dark';
  corsProxy: string;
  corsEnabled: Record<string, boolean>;
  customBaseUrl: string;
  thinkingLevel: 'off' | 'low' | 'medium' | 'high';
  favoriteCharacters: string[];
  setApiKey: (provider: string, key: string) => void;
  setDefaultProvider: (provider: string) => void;
  setDefaultModel: (model: string) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCorsProxy: (proxy: string) => void;
  setCorsEnabled: (provider: string, enabled: boolean) => void;
  setCustomBaseUrl: (url: string) => void;
  setThinkingLevel: (level: 'off' | 'low' | 'medium' | 'high') => void;
  toggleFavorite: (characterId: string) => void;
  clearApiKeys: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {},
      defaultProvider: 'deepseek',
      defaultModel: 'deepseek-chat',
      language: navigator.language || 'en',
      theme: 'light',
      corsProxy: 'https://cors.api2026.workers.dev',
      corsEnabled: { volcengine: true, alibaba: true },
      customBaseUrl: '',
      thinkingLevel: 'off' as const,
      favoriteCharacters: [],
      setApiKey: (provider, key) =>
        set((s) => ({ apiKeys: { ...s.apiKeys, [provider]: key } })),
      setDefaultProvider: (defaultProvider) => set({ defaultProvider }),
      setDefaultModel: (defaultModel) => set({ defaultModel }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setCorsProxy: (corsProxy) => set({ corsProxy }),
      setCorsEnabled: (provider, enabled) =>
        set((s) => ({ corsEnabled: { ...s.corsEnabled, [provider]: enabled } })),
      setCustomBaseUrl: (customBaseUrl) => set({ customBaseUrl }),
      setThinkingLevel: (thinkingLevel) => set({ thinkingLevel }),
      toggleFavorite: (characterId) =>
        set((s) => ({
          favoriteCharacters: s.favoriteCharacters.includes(characterId)
            ? s.favoriteCharacters.filter((id) => id !== characterId)
            : [...s.favoriteCharacters, characterId],
        })),
      clearApiKeys: () => set({ apiKeys: {} }),
    }),
    { name: 'legend-talk-settings', storage: createJSONStorage(() => persistStorage) },
  ),
);
