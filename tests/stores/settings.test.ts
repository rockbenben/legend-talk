import { useSettingsStore } from '../../src/stores/settings';

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
    useSettingsStore.getState().setDefaultProvider('anthropic');
    useSettingsStore.getState().setDefaultModel('claude-sonnet-4-20250514');
    expect(useSettingsStore.getState().defaultProvider).toBe('anthropic');
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
    useSettingsStore.getState().setApiKey('anthropic', 'sk-2');
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
      s().setDefaultProvider('anthropic');
      s().setDefaultModel('claude-sonnet-5');
      s().setDefaultProvider('deepseek');
      expect(s().defaultModel).toBe('deepseek-v4-pro');
      s().setDefaultProvider('anthropic');
      expect(s().defaultModel).toBe('claude-sonnet-5');
    });

    it('falls back to the first catalog model on first visit to a provider', () => {
      useSettingsStore.getState().setDefaultProvider('zhipu');
      expect(useSettingsStore.getState().defaultModel).toBe('glm-5.2');
    });

    it('snapshots legacy active model even if it was never set through the setter', () => {
      // Simulates state persisted before the memory maps existed.
      useSettingsStore.setState({ defaultProvider: 'openai', defaultModel: 'gpt-5.6-luna', modelByProvider: {} });
      const s = () => useSettingsStore.getState();
      s().setDefaultProvider('anthropic');
      s().setDefaultProvider('openai');
      expect(s().defaultModel).toBe('gpt-5.6-luna');
    });

    it('remembers thinking level per provider, inheriting on first visit', () => {
      const s = () => useSettingsStore.getState();
      s().setThinkingLevel('high');
      s().setDefaultProvider('anthropic');
      expect(s().thinkingLevel).toBe('high'); // first visit inherits
      s().setThinkingLevel('off');
      s().setDefaultProvider('deepseek');
      expect(s().thinkingLevel).toBe('high');
      s().setDefaultProvider('anthropic');
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
  });
});
