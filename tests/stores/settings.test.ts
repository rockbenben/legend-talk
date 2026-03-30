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
    expect(state.defaultModel).toBe('deepseek-chat');
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
});
