import { AnthropicAdapter } from '../../src/adapters/anthropic';

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
  return vi.fn().mockResolvedValue({ ok: true, body: stream });
}

describe('AnthropicAdapter', () => {
  const adapter = new AnthropicAdapter();

  it('has correct metadata', () => {
    expect(adapter.id).toBe('anthropic');
    expect(adapter.name).toBe('Anthropic');
    expect(adapter.models.length).toBeGreaterThan(0);
  });

  it('extracts system message and streams response', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchStream([
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":" there"}}\n\n',
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    ]);

    const tokens: string[] = [];
    for await (const token of adapter.chat({
      messages: [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'hi' },
      ],
      model: 'claude-sonnet-4-20250514',
      apiKey: 'sk-ant-test',
    })) {
      tokens.push(token);
    }
    expect(tokens).toEqual(['Hello', ' there']);

    const callBody = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(callBody.system).toBe('You are helpful');
    expect(callBody.messages).toEqual([{ role: 'user', content: 'hi' }]);

    globalThis.fetch = originalFetch;
  });

  it('sends correct headers', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchStream([
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    ]);

    for await (const _ of adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      model: 'claude-sonnet-4-20250514',
      apiKey: 'sk-ant-test',
    })) {
      // consume
    }

    const callHeaders = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(callHeaders['x-api-key']).toBe('sk-ant-test');
    expect(callHeaders['anthropic-version']).toBe('2023-06-01');
    expect(callHeaders['anthropic-dangerous-direct-browser-access']).toBe('true');

    globalThis.fetch = originalFetch;
  });

  async function chatBody(model: string, thinkingLevel?: 'low' | 'medium' | 'high') {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetchStream([
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
    ]);
    for await (const _ of adapter.chat({
      messages: [{ role: 'user', content: 'hi' }],
      model,
      apiKey: 'sk-ant-test',
      thinkingLevel,
    })) { /* consume */ }
    const body = JSON.parse(
      (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    globalThis.fetch = originalFetch;
    return body;
  }

  it('uses adaptive thinking on Opus 4.7 (budget_tokens 400s there)', async () => {
    const body = await chatBody('claude-opus-4-7', 'high');
    expect(body.thinking).toEqual({ type: 'adaptive' });
    expect(body.output_config).toEqual({ effort: 'high' });
    expect(body.max_tokens).toBe(128000);
  });

  it('caps max_tokens at 64K for Sonnet with thinking', async () => {
    const body = await chatBody('claude-sonnet-4-6', 'medium');
    expect(body.thinking).toEqual({ type: 'adaptive' });
    expect(body.max_tokens).toBe(64000);
  });

  it('keeps budget-style thinking on Haiku, below its 64K output cap', async () => {
    const body = await chatBody('claude-haiku-4-5-20251001', 'high');
    expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 50000 });
    expect(body.max_tokens).toBe(64000);
    expect(body.thinking.budget_tokens).toBeLessThan(body.max_tokens);
  });

  it('omits thinking entirely when no thinking level set', async () => {
    const body = await chatBody('claude-opus-4-7');
    expect(body.thinking).toBeUndefined();
    expect(body.output_config).toBeUndefined();
    expect(body.max_tokens).toBe(16384);
  });
});
