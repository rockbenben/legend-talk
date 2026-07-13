import { OpenAICompatibleAdapter } from '../../src/adapters/openai-compatible';

function mockFetchStream(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return vi.fn().mockResolvedValue({
    ok: true,
    body: stream,
  });
}

describe('OpenAICompatibleAdapter', () => {
  const adapter = new OpenAICompatibleAdapter(
    'test-provider',
    'Test Provider',
    'https://api.test.com/v1',
    [{ id: 'test-model', name: 'Test Model' }],
  );

  it('has correct metadata', () => {
    expect(adapter.id).toBe('test-provider');
    expect(adapter.name).toBe('Test Provider');
    expect(adapter.models).toHaveLength(1);
    expect(adapter.models[0].id).toBe('test-model');
  });

  it('streams chat response tokens', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);

    const tokens: string[] = [];
    for await (const token of adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      model: 'test-model',
      apiKey: 'sk-test',
    })) {
      tokens.push(token);
    }
    expect(tokens).toEqual(['Hello', ' world']);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    );

    globalThis.fetch = originalFetch;
  });

  it('uses CORS proxy when provided', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchStream([
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n',
    ]);

    const tokens: string[] = [];
    for await (const token of adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      model: 'test-model',
      apiKey: 'sk-test',
      corsProxy: 'https://proxy.example.com',
    })) {
      tokens.push(token);
    }

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://proxy.example.com/https://api.test.com/v1/chat/completions',
      expect.anything(),
    );

    globalThis.fetch = originalFetch;
  });

  async function chatBody(
    adapter: OpenAICompatibleAdapter,
    model: string,
    thinkingLevel?: 'off' | 'low' | 'medium' | 'high',
  ) {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchStream(['data: [DONE]\n\n']);
    for await (const _ of adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      model,
      apiKey: 'sk-test',
      thinkingLevel,
    })) { /* consume */ }
    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    globalThis.fetch = originalFetch;
    return body;
  }

  describe('thinking mappers', () => {
    const thinkingTypeAdapter = new OpenAICompatibleAdapter(
      'tt', 'TT', 'https://api.tt.com/v1',
      [{ id: 'cap', name: 'Capable' }, { id: 'plain', name: 'Plain', thinking: false }],
      { thinkingStyle: 'thinking_type' },
    );

    it('thinking_type sends enabled when on', async () => {
      const body = await chatBody(thinkingTypeAdapter, 'cap', 'high');
      expect(body.thinking).toEqual({ type: 'enabled' });
    });

    it('thinking_type sends explicit disabled when off (server default is ON)', async () => {
      const body = await chatBody(thinkingTypeAdapter, 'cap');
      expect(body.thinking).toEqual({ type: 'disabled' });
    });

    it('never sends thinking params to models tagged thinking:false', async () => {
      expect((await chatBody(thinkingTypeAdapter, 'plain', 'high')).thinking).toBeUndefined();
      expect((await chatBody(thinkingTypeAdapter, 'plain')).thinking).toBeUndefined();
    });

    it('unlisted (custom) models: opt-in enables, off omits (400-safe)', async () => {
      expect((await chatBody(thinkingTypeAdapter, 'mystery', 'low')).thinking).toEqual({ type: 'enabled' });
      expect((await chatBody(thinkingTypeAdapter, 'mystery')).thinking).toBeUndefined();
    });

    it('thinking_adaptive maps on→adaptive, off→disabled (MiniMax M3)', async () => {
      const adapter = new OpenAICompatibleAdapter(
        'mm', 'MM', 'https://api.mm.com/v1',
        [{ id: 'MiniMax-M3', name: 'M3' }],
        { thinkingStyle: 'thinking_adaptive' },
      );
      expect((await chatBody(adapter, 'MiniMax-M3', 'medium')).thinking).toEqual({ type: 'adaptive' });
      expect((await chatBody(adapter, 'MiniMax-M3')).thinking).toEqual({ type: 'disabled' });
    });

    it('reasoning_effort omits when off; reasoning_effort_none sends explicit none', async () => {
      const graded = new OpenAICompatibleAdapter(
        'g', 'G', 'https://api.g.com/v1', [{ id: 'm', name: 'M' }],
        { thinkingStyle: 'reasoning_effort' },
      );
      expect((await chatBody(graded, 'm', 'medium')).reasoning_effort).toBe('medium');
      expect((await chatBody(graded, 'm')).reasoning_effort).toBeUndefined();

      const withNone = new OpenAICompatibleAdapter(
        'o', 'O', 'https://api.o.com/v1', [{ id: 'gpt', name: 'GPT' }],
        { thinkingStyle: 'reasoning_effort_none' },
      );
      expect((await chatBody(withNone, 'gpt')).reasoning_effort).toBe('none');
    });

    it('reasoning_effort_low_high collapses medium to low (xAI)', async () => {
      const adapter = new OpenAICompatibleAdapter(
        'x', 'X', 'https://api.x.com/v1', [{ id: 'grok', name: 'Grok' }],
        { thinkingStyle: 'reasoning_effort_low_high' },
      );
      expect((await chatBody(adapter, 'grok', 'medium')).reasoning_effort).toBe('low');
      expect((await chatBody(adapter, 'grok', 'high')).reasoning_effort).toBe('high');
      expect((await chatBody(adapter, 'grok')).reasoning_effort).toBe('none');
    });

    it('reasoning_effort_openrouter sends reasoning:{enabled:false} when off', async () => {
      const adapter = new OpenAICompatibleAdapter(
        'or', 'OR', 'https://api.or.com/v1', [{ id: 'anthropic/claude-sonnet-5', name: 'S5' }],
        { thinkingStyle: 'reasoning_effort_openrouter' },
      );
      expect((await chatBody(adapter, 'anthropic/claude-sonnet-5', 'high')).reasoning_effort).toBe('high');
      const off = await chatBody(adapter, 'anthropic/claude-sonnet-5');
      expect(off.reasoning).toEqual({ enabled: false });
      expect(off.reasoning_effort).toBeUndefined();
    });

    it('providers without a thinkingStyle never send thinking params', async () => {
      const body = await chatBody(adapter, 'test-model', 'high');
      expect(body.thinking).toBeUndefined();
      expect(body.reasoning_effort).toBeUndefined();
    });
  });

  it('throws on non-ok response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    const gen = adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      model: 'test-model',
      apiKey: 'bad-key',
    });
    await expect(gen.next()).rejects.toThrow('Unauthorized');

    globalThis.fetch = originalFetch;
  });
});
