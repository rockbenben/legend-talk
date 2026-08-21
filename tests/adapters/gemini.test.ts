import { GeminiAdapter } from '../../src/adapters/gemini';
import type { ThinkingLevel } from '../../src/types';

const adapter = new GeminiAdapter();

function sse(chunks: string[]): Response {
  const body = chunks.map((c) => `data: ${c}\n\n`).join('');
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

/** 跑一次 chat，返回实际发出的 [url, requestInit] 与拼出的文本。 */
async function run(model: string, thinkingLevel?: ThinkingLevel, messages = [{ role: 'user' as const, content: 'hi' }]) {
  const original = globalThis.fetch;
  const fetchMock = vi.fn(async () =>
    sse([JSON.stringify({ candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] })]),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  let text = '';
  for await (const d of adapter.chat({ messages, model, apiKey: 'k', thinkingLevel })) text += d;
  globalThis.fetch = original;
  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return { url, body: JSON.parse(String(init.body)), headers: init.headers as Record<string, string>, text };
}

describe('GeminiAdapter', () => {
  it('走原生接口而不是 OpenAI 兼容层，认证用 x-goog-api-key 头', async () => {
    const { url, headers } = await run('gemini-3.7-flash');
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:streamGenerateContent?alt=sse',
    );
    // 兼容层的痕迹一个都不该有
    expect(url).not.toContain('/openai');
    expect(headers['x-goog-api-key']).toBe('k');
    expect(headers.Authorization).toBeUndefined();
    // key 不进 URL：官方已撤掉 ?key=，也省得它进日志与 Referer
    expect(url).not.toContain('key=k');
  });

  it('拼接全部 text part，并跳过 thought part', async () => {
    const { text } = await run('gemini-3.7-flash');
    expect(text).toBe('ab');
  });

  it('system 走 systemInstruction；没有 system 时整个字段省略（空 text 会 400）', async () => {
    const withSys = await run('gemini-3.7-flash', 'off', [
      { role: 'system', content: 'S' } as never,
      { role: 'user', content: 'hi' },
    ]);
    expect(withSys.body.systemInstruction).toEqual({ parts: [{ text: 'S' }] });
    expect(withSys.body.contents).toEqual([{ role: 'user', parts: [{ text: 'hi' }] }]);

    const noSys = await run('gemini-3.7-flash');
    expect('systemInstruction' in noSys.body).toBe(false);
  });

  it('关闭态发该 SKU 的最低档，而不是省略 —— Gemini 3 没有关闭开关', async () => {
    // 省略会落到服务端默认档位，用户点了「关」反而按中档计费
    const { body } = await run('gemini-3.7-flash', 'off');
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'low' });
    // 3.5 系多一档 minimal，最低档就不同
    const lite = await run('gemini-3.5-flash-lite', 'off');
    expect(lite.body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'minimal' });
  });

  it('该 SKU 不收的档位降到不高于所选的最高档 —— 发枚举外的值是确定性 400', async () => {
    // 3.7-flash 只收 low/medium/high，没有 minimal
    expect((await run('gemini-3.7-flash', 'high')).body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'high' });
    expect((await run('gemini-3.5-flash', 'medium')).body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'medium' });
  });

  it('用户手填的未列出 SKU 退到 provider 级档位 —— 与上游的 custom 分支一致', async () => {
    // Gemini 全系都思考，未列出的 SKU 也不例外；省略反而会落到服务端默认档位。
    const { body } = await run('gemini-experimental-whatever', 'high');
    expect(body.generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'high' });
    expect((await run('gemini-experimental-whatever', 'off')).body.generationConfig.thinkingConfig).toEqual({
      thinkingLevel: 'low',
    });
  });

  it('不发 temperature —— Gemini 3.x 官方建议用默认值', async () => {
    const { body } = await run('gemini-3.7-flash', 'high');
    expect(body.generationConfig.temperature).toBeUndefined();
  });

  it('模型清单与链接取自目录，不再手抄', async () => {
    expect(adapter.models.length).toBeGreaterThan(0);
    expect(adapter.models.some((m) => m.id === 'gemini-3.7-flash')).toBe(true);
    expect(adapter.docsUrl).toContain('ai.google.dev');
    expect(adapter.apiKeyUrl).toContain('aistudio.google.com');
  });
});
