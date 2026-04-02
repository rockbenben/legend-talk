import { getLangInstruction, buildSystemPrompt, ROUNDTABLE_SUFFIX, resolveProvider } from '../../src/utils/prompt';
import { useSettingsStore } from '../../src/stores/settings';
import * as registry from '../../src/adapters/registry';

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
    validateKey: vi.fn(),
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

  it('excludes corsProxy when not enabled for provider', () => {
    vi.spyOn(registry, 'getAdapter').mockReturnValue(mockAdapter);
    useSettingsStore.getState().setApiKey('deepseek', 'sk-test');
    useSettingsStore.getState().setCorsProxy('https://proxy.example.com');
    useSettingsStore.getState().setCorsEnabled('deepseek', false);

    const result = resolveProvider();
    expect(result!.corsProxy).toBeUndefined();
  });
});
