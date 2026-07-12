import { parseSharedPayload } from '../../src/pages/SharedView';

describe('parseSharedPayload', () => {
  it('accepts a well-formed payload', () => {
    const out = parseSharedPayload(JSON.stringify({
      title: 'On Justice',
      characters: ['socrates'],
      messages: [{ role: 'user', content: 'hi' }],
    }));
    expect(out.title).toBe('On Justice');
    expect(out.characters).toEqual(['socrates']);
    expect(out.messages).toHaveLength(1);
  });

  it('throws on non-array messages/characters (graceful error path)', () => {
    expect(() => parseSharedPayload(JSON.stringify({ messages: {}, characters: [] }))).toThrow();
    expect(() => parseSharedPayload(JSON.stringify({ messages: [], characters: 'x' }))).toThrow();
    expect(() => parseSharedPayload('"just a string"')).toThrow();
    expect(() => parseSharedPayload('null')).toThrow();
  });

  // Regression: a tampered link with a non-string title (object) used to reach
  // React as a child via displayTitle and throw "Objects are not valid as a
  // React child", collapsing the whole app into the top-level ErrorBoundary.
  it('drops a non-string title instead of letting it reach a React child', () => {
    for (const title of [{}, { a: 1 }, [1, 2], 42, true]) {
      const out = parseSharedPayload(JSON.stringify({ title, characters: [], messages: [] }));
      expect(out.title).toBeUndefined();
    }
  });

  it('preserves an empty-string title as undefined-equivalent falsy', () => {
    const out = parseSharedPayload(JSON.stringify({ title: '', characters: [], messages: [] }));
    expect(out.title).toBe('');
  });
});
