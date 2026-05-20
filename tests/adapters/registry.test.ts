import { getAdapter, getAllAdapters } from '../../src/adapters/registry';

describe('adapter registry', () => {
  it('returns all registered adapters', () => {
    const adapters = getAllAdapters();
    const ids = adapters.map((a) => a.id);
    expect(ids).toContain('openai');
    expect(ids).toContain('anthropic');
    expect(ids).toContain('deepseek');
    expect(ids).toContain('volcengine');
    expect(ids).toContain('alibaba');
    expect(ids).toContain('siliconflow');
    expect(ids).toContain('groq');
    expect(ids).toContain('openrouter');
    expect(ids).toContain('custom');
    // Core providers above must all be present; the registry grows over time
    // as new providers are added, so we only guard against accidental removal.
    expect(adapters.length).toBeGreaterThanOrEqual(9);
  });

  it('gets adapter by id', () => {
    const adapter = getAdapter('openai');
    expect(adapter).toBeDefined();
    expect(adapter!.id).toBe('openai');
    expect(adapter!.models.length).toBeGreaterThan(0);
  });

  it('returns undefined for unknown id', () => {
    expect(getAdapter('nonexistent')).toBeUndefined();
  });

  it('each non-custom adapter has models', () => {
    for (const adapter of getAllAdapters()) {
      if (adapter.id === 'custom') continue;
      expect(adapter.models.length).toBeGreaterThan(0);
    }
  });
});
