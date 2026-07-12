import { useSettingsStore } from '../../src/stores/settings';
import { MODEL_ID_MIGRATIONS, migrateModelId } from '../../src/adapters/registry';

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

  describe('model id migration', () => {
    it('migrateModelId remaps known renamed ids and passes through the rest', () => {
      expect(migrateModelId('claude-opus-4-7')).toBe('claude-opus-4-8');
      expect(migrateModelId('claude-sonnet-4-6')).toBe('claude-sonnet-5');
      expect(migrateModelId('mistral-small-4')).toBe('mistral-small-latest');
      expect(migrateModelId('hunyuan-turbos-latest')).toBe('hunyuan-a13b');
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
      expect(migrateModelId('grok-4.3')).toBe('grok-4.3'); // still a live xAI SKU
      expect(migrateModelId('x-ai/grok-4.3')).toBe('x-ai/grok-4.5'); // OpenRouter, retired
    });
  });
});
