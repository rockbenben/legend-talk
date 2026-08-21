import { OpenAICompatibleAdapter } from '../../src/adapters/openai-compatible';
import { getAdapter } from '../../src/adapters/registry';

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

  describe('thinking wire', () => {
    const TT = {
      off: { thinking: { type: 'disabled' } },
      low: { thinking: { type: 'enabled' } },
      medium: { thinking: { type: 'enabled' } },
      high: { thinking: { type: 'enabled' } },
    };
    const adapter = new OpenAICompatibleAdapter(
      'tt', 'TT', 'https://api.tt.com/v1',
      [
        { id: 'cap', name: 'Capable', thinkingWire: TT },
        // 没有 thinkingWire = 这个 SKU 一个思考参数都不该发（已知不思考，
        // 或这家没有已知形态）。
        { id: 'plain', name: 'Plain' },
      ],
      { fallbackThinkingWire: TT },
    );

    it('按档位取对应的 wire 条目', async () => {
      expect((await chatBody(adapter, 'cap', 'high')).thinking).toEqual({ type: 'enabled' });
      expect((await chatBody(adapter, 'cap', 'low')).thinking).toEqual({ type: 'enabled' });
    });

    it('关闭态发显式 disable —— 服务端默认开着思考时，省略等于按推理静默计费', async () => {
      expect((await chatBody(adapter, 'cap')).thinking).toEqual({ type: 'disabled' });
    });

    it('没有 thinkingWire 的 SKU 一个参数都不发', async () => {
      expect((await chatBody(adapter, 'plain', 'high')).thinking).toBeUndefined();
      expect((await chatBody(adapter, 'plain')).thinking).toBeUndefined();
    });

    it('用户手填的未列出 SKU 退到 provider 级形态', async () => {
      expect((await chatBody(adapter, 'mystery', 'low')).thinking).toEqual({ type: 'enabled' });
      expect((await chatBody(adapter, 'mystery')).thinking).toEqual({ type: 'disabled' });
    });

    it('provider 没有 fallback 时，未列出 SKU 也不发 —— 形态未知别乱猜', async () => {
      const bare = new OpenAICompatibleAdapter(
        'b', 'B', 'https://api.b.com/v1', [{ id: 'm', name: 'M' }],
      );
      expect((await chatBody(bare, 'mystery', 'high')).thinking).toBeUndefined();
    });

    it('缺 off 键 = 关闭态不发（厂商没有关闭值时由最低档承担）', async () => {
      const noOff = new OpenAICompatibleAdapter(
        'n', 'N', 'https://api.n.com/v1',
        [{ id: 'm', name: 'M', thinkingWire: { low: { reasoning_effort: 'low' }, high: { reasoning_effort: 'high' } } }],
      );
      expect((await chatBody(noOff, 'm', 'high')).reasoning_effort).toBe('high');
      expect((await chatBody(noOff, 'm')).reasoning_effort).toBeUndefined();
    });

    it('prefixes HTTP failures with the status code', async () => {
      const adapter = new OpenAICompatibleAdapter('p', 'P', 'https://api.p.com/v1', [{ id: 'm', name: 'M' }]);
      // An origin/WAF block answers with HTML, so the body carries no code — the
      // prefix is what lets the UI offer "route through the proxy" instead of a
      // dead-end error.
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
        new Response('<html>Forbidden</html>', { status: 403, statusText: 'Forbidden' }),
      ));
      await expect(async () => {
        for await (const _ of adapter.chat({ messages: [], model: 'm', apiKey: 'k' })) { /* drain */ }
      }).rejects.toThrow(/^\[403\]/);
    });

    // 形态不再由本地映射表决定，而是随目录逐 SKU 下发。所以这里直接拿【真实
    // provider】断言 —— 既验证接线，也验证目录数据本身，且不可能与上游分叉。
    it('真实 provider 的思考参数取自目录', async () => {
      const cases: Array<[string, string, 'low' | 'medium' | 'high' | undefined, Record<string, unknown>]> = [
        // xAI 无关闭值（官方明写 reasoning cannot be disabled）→ 关闭态发最低档
        ['grok', 'grok-4.6', undefined, { reasoning_effort: 'low' }],
        ['grok', 'grok-4.6', 'medium', { reasoning_effort: 'medium' }],
        // Cohere 的推理 SKU 服务端默认开 → 关闭态发显式 none
        ['cohere', 'command-a-reasoning-08-2025', undefined, { reasoning_effort: 'none' }],
        // 千帆同理，用 enable_thinking 家族
        ['qianfan', 'ernie-5.0-thinking-latest', undefined, { enable_thinking: false }],
        // 同一家逐 SKU 形态不同 —— 这正是「一个 provider 一种形态」表达不了的
        ['moonshot', 'kimi-k3', undefined, { reasoning_effort: 'low' }],
        ['moonshot', 'kimi-k2.6', undefined, { thinking: { type: 'disabled' } }],
      ];
      for (const [provider, model, level, expected] of cases) {
        const a = getAdapter(provider);
        expect(a, `${provider} 不存在`).toBeDefined();
        const body = await chatBody(a as OpenAICompatibleAdapter, model, level);
        for (const [k, v] of Object.entries(expected)) {
          expect(body[k], `${provider}/${model} @${level ?? 'off'} 的 ${k}`).toEqual(v);
        }
      }
    });

    it('目录未给形态的 SKU 一个思考参数都不发', async () => {
      // tokenhub 的 SKU 目录里都没有形态（上游没有已知的思考线格式）
      const body = await chatBody(getAdapter('tokenhub') as OpenAICompatibleAdapter, 'hy3', 'high');
      expect(body.thinking).toBeUndefined();
      expect(body.reasoning_effort).toBeUndefined();
      expect(body.enable_thinking).toBeUndefined();
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
