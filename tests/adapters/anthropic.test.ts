import { AnthropicAdapter } from '../../src/adapters/anthropic';
import anthropicSrc from '../../src/adapters/anthropic.ts?raw';
import type { ThinkingLevel } from '../../src/types';

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
    expect(adapter.id).toBe('claude');
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

  async function chatBody(model: string, thinkingLevel?: ThinkingLevel) {
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

  it('caps max_tokens at 64K for Sonnet 5 with adaptive thinking', async () => {
    const body = await chatBody('claude-sonnet-5', 'medium');
    expect(body.thinking).toEqual({ type: 'adaptive' });
    expect(body.output_config).toEqual({ effort: 'medium' });
    expect(body.max_tokens).toBe(64000);
  });

  it('treats Fable 5 as adaptive generation', async () => {
    const body = await chatBody('claude-fable-5', 'low');
    expect(body.thinking).toEqual({ type: 'adaptive' });
    expect(body.max_tokens).toBe(64000);
  });

  it('keeps budget-style thinking on Sonnet 4.6 (extended generation)', async () => {
    const body = await chatBody('claude-sonnet-4-6', 'medium');
    expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 25000 });
    expect(body.output_config).toBeUndefined();
    expect(body.max_tokens).toBe(64000);
  });

  it('keeps budget-style thinking on Haiku, below its 64K output cap', async () => {
    const body = await chatBody('claude-haiku-4-5-20251001', 'high');
    expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 50000 });
    expect(body.max_tokens).toBe(64000);
    // 这条才是要守的：budget_tokens 必须【小于】max_tokens，否则 400
    expect(body.thinking.budget_tokens).toBeLessThan(body.max_tokens);
  });

  it('sends explicit disabled on adaptive models when thinking is off (server default is ON)', async () => {
    const body = await chatBody('claude-sonnet-5');
    expect(body.thinking).toEqual({ type: 'disabled' });
    expect(body.output_config).toBeUndefined();
  });

  it('omits thinking entirely on budget-generation models when off', async () => {
    const body = await chatBody('claude-haiku-4-5-20251001');
    expect(body.thinking).toBeUndefined();
  });

  // 官方逐模型表把 Fable 5 标成 Always on：它连关闭值都拒收（400），
  // 同代的 Sonnet 5 / Opus 5 却接受。所以「关」在这一支只能是整个字段不发 ——
  // 形态必须取该 SKU 自己那份，不能一律用按名字判代的那条回退规则。
  it('关不掉思考的型号：关闭档一个字段都不发，而不是发关闭值', async () => {
    const body = await chatBody('claude-fable-5');
    expect(body.thinking, 'Fable 5 收到 disabled 会 400').toBeUndefined();
    expect(body.output_config).toBeUndefined();
  });

  // max_tokens 是【本 app 的事】，但不能按名字猜上限：按 opus/其他分档时，
  // 手填一个 64K 上限的旧 opus 会拿到 128K 并 400。一律取全型号都支持的那档。
  it('输出上限对所有型号取同一个值，且高过最高一档 budget', async () => {
    for (const model of ['claude-sonnet-5', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-fable-5']) {
      const b = await chatBody(model, 'high');
      expect(b.max_tokens, model).toBe(64000);
    }
  });

  it('budget_tokens 按【本 app 的 max_tokens】定，不照搬目录', async () => {
    // budget_tokens 是绝对整数且必须小于 max_tokens，所以它耦合调用方的输出上限：
    // 目录里的 4096/10000/12000 是按上游 max_tokens=16384 反推的，本 app 是 64K/128K。
    // 每一档都必须留出可见回复的余量 —— 这才是真正的不变量。
    for (const level of ['low', 'medium', 'high'] as const) {
      const b = await chatBody('claude-haiku-4-5', level);
      expect(b.thinking.budget_tokens, level).toBeLessThan(b.max_tokens);
      expect(b.max_tokens - b.thinking.budget_tokens, level).toBeGreaterThanOrEqual(8000);
    }
  });

  it('在册与手填的旧世代走同一条本地规则，给出同一套 budget', async () => {
    for (const level of ['low', 'medium', 'high'] as const) {
      const listed = await chatBody('claude-haiku-4-5', level);
      const typed = await chatBody('claude-sonnet-4-6', level);
      expect(typed.thinking, level).toEqual(listed.thinking);
    }
  });

  it('4.7 / 4.8 必须按 adaptive 发 —— 官方明写它们拒收 budget_tokens', async () => {
    // 这条被删过一次：当时以为「不列进可选模型」等于「判代也不用管」，但用户
    // 手填得进去，而 4.7 及以后收到 budget_tokens 是直接 400。
    for (const model of ['claude-opus-4-7', 'claude-opus-4-8']) {
      const b = await chatBody(model, 'high');
      expect(b.thinking, model).toEqual({ type: 'adaptive' });
      expect(b.output_config, model).toEqual({ effort: 'high' });
      expect(b.thinking.budget_tokens, `${model} 不该带 budget_tokens`).toBeUndefined();
    }
  });

  it('判代规则来自目录，本地不再写正则 —— 它已经漂过一次', async () => {
    const { findProvider } = await import('../../src/adapters/providerCatalog.generated');
    const rules = findProvider('claude')!.thinkingWireIf!;
    expect(rules.some((r) => r.pattern.includes('opus-4-[78]'))).toBe(true);
    expect(anthropicSrc, '本地又出现了判代正则').not.toMatch(/\/claude-\(opus/);
  });

  it('官方标 Always on 的手填 SKU 关闭档什么都不发 —— 发 disabled 是每请求 400', async () => {
    // 在册的 fable-5 走 models[] 那条路早就对了；坏的是【带日期的手填变体】：
    // 它同时匹配两条规则，取错一条就把被拒的关闭值发出去。目录按窄的在前排序，
    // 本适配器取首个匹配 —— 这条钉的就是那个顺序。
    const b = await chatBody('claude-fable-5-20260609', 'off');
    expect(b.thinking, '关不掉的 SKU 不该收到任何 thinking 字段').toBeUndefined();
    const on = await chatBody('claude-fable-5-20260609', 'high');
    expect(on.thinking).toEqual({ type: 'adaptive' });
    expect(on.output_config).toEqual({ effort: 'high' });
  });
});
