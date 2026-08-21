import { parseSSE } from '../../src/adapters/sse';

function makeStream(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return { body: stream } as Response;
}

describe('parseSSE', () => {
  it('parses single-line SSE data events', async () => {
    const response = makeStream([
      'data: {"text":"hello"}\n\ndata: {"text":"world"}\n\n',
    ]);
    const results: string[] = [];
    for await (const data of parseSSE(response)) {
      results.push(data);
    }
    expect(results).toEqual(['{"text":"hello"}', '{"text":"world"}']);
  });

  it('stops at [DONE]', async () => {
    const response = makeStream([
      'data: {"text":"hi"}\n\ndata: [DONE]\n\ndata: {"text":"ignored"}\n\n',
    ]);
    const results: string[] = [];
    for await (const data of parseSSE(response)) {
      results.push(data);
    }
    expect(results).toEqual(['{"text":"hi"}']);
  });

  it('handles chunks split across reads', async () => {
    const response = makeStream([
      'data: {"te',
      'xt":"split"}\n\n',
    ]);
    const results: string[] = [];
    for await (const data of parseSSE(response)) {
      results.push(data);
    }
    expect(results).toEqual(['{"text":"split"}']);
  });

  it('ignores non-data lines', async () => {
    const response = makeStream([
      'event: message_start\ndata: {"type":"start"}\n\nevent: delta\ndata: {"type":"delta"}\n\n',
    ]);
    const results: string[] = [];
    for await (const data of parseSSE(response)) {
      results.push(data);
    }
    expect(results).toEqual(['{"type":"start"}', '{"type":"delta"}']);
  });

  it('joins multi-line data fields into one event', async () => {
    const response = makeStream(['data: line one\ndata: line two\n\n']);
    const results: string[] = [];
    for await (const data of parseSSE(response)) {
      results.push(data);
    }
    expect(results).toEqual(['line one\nline two']);
  });

  it('flushes a final event with no trailing blank line', async () => {
    const response = makeStream(['data: {"text":"tail"}']);
    const results: string[] = [];
    for await (const data of parseSSE(response)) {
      results.push(data);
    }
    expect(results).toEqual(['{"text":"tail"}']);
  });

  it('decodes a multibyte char split across reads with no trailing newline', async () => {
    // "你" is 3 UTF-8 bytes; split them across two reads so the decoder must hold the
    // partial sequence and flush it at end-of-stream.
    const bytes = new TextEncoder().encode('data: 你');
    const splitAt = bytes.length - 1;
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, splitAt));
        controller.enqueue(bytes.slice(splitAt));
        controller.close();
      },
    });
    const results: string[] = [];
    for await (const data of parseSSE({ body: stream } as Response)) {
      results.push(data);
    }
    expect(results).toEqual(['你']);
  });
});

describe('空闲超时', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** 一个可控的流：手动推 chunk，不推就一直挂着。 */
  function stalling() {
    let push!: (s: string) => void;
    let close!: () => void;
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        push = (s) => c.enqueue(new TextEncoder().encode(s));
        close = () => c.close();
      },
    });
    return { res: new Response(body, { status: 200 }), push, close };
  }

  it('首字节前给足 3 分钟 —— 思考模型想一两分钟是正常的', async () => {
    const { res, push, close } = stalling();
    const it = parseSSE(res)[Symbol.asyncIterator]();
    const first = it.next();
    // 两分钟还没吐字：不该报错，思考中
    await vi.advanceTimersByTimeAsync(120_000);
    push('data: hi\n\n');
    close();
    await expect(first).resolves.toEqual({ done: false, value: 'hi' });
  });

  it('首字节迟迟不来则抛错，而不是让界面永远转圈', async () => {
    const { res } = stalling();
    const it = parseSSE(res)[Symbol.asyncIterator]();
    const first = it.next();
    const settled = first.catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(180_001);
    expect(await settled).toMatch(/Stream stalled/);
  });

  // 回归：这一档曾经收紧到 60 秒，前提是「出过字 = 模型开始作答」。可
  // 「出过字」这个标志位是收到【任意字节】就置真的，开头那个只带 delta.role 的 chunk、
  // SSE 注释心跳、Anthropic 的 message_start 全都算 —— 于是「先吐个头再默默
  // 推理」的模型（GPT-5.x 高推理档）会在正常推理中途被掐掉，而推理 token 已经
  // 付过钱了。要判准就得在这一层认各家的载荷格式，那是适配器的活。
  it('出过字之后仍然给足 3 分钟 —— 头 chunk 不等于模型开始作答', async () => {
    const { res, push, close } = stalling();
    const it = parseSSE(res)[Symbol.asyncIterator]();
    push('data: a\n\n');
    await expect(it.next()).resolves.toEqual({ done: false, value: 'a' });
    const second = it.next();
    // 出过字之后再静默两分钟：仍在预算内，不该报错
    await vi.advanceTimersByTimeAsync(120_000);
    push('data: b\n\n');
    close();
    await expect(second).resolves.toEqual({ done: false, value: 'b' });
  });

  it('出过字之后彻底不动，还是会抛错，不至于永远转圈', async () => {
    const { res, push } = stalling();
    const it = parseSSE(res)[Symbol.asyncIterator]();
    push('data: a\n\n');
    await expect(it.next()).resolves.toEqual({ done: false, value: 'a' });
    const second = it.next();
    const settled = second.catch((e: Error) => e.message);
    await vi.advanceTimersByTimeAsync(180_001);
    expect(await settled).toMatch(/Stream stalled/);
  });
})
