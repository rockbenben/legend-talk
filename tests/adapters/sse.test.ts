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
