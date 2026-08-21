/**
 * Parse a Server-Sent Events response, yielding one payload per event.
 *
 * Follows the SSE framing rules that matter for LLM streams: an event is a run of
 * lines terminated by a blank line; `data:` lines accumulate and are joined with
 * `\n` (so a multi-line `data:` event yields one payload, not fragments); `event:`,
 * `id:`, `retry:` and comment (`:`) lines are ignored. A trailing event with no
 * final blank line (stream closed early) is still flushed.
 *
 * 空闲超时：连接挂住时抛错，而不是让界面永远转圈。只有【一档】，给足。
 *
 * 曾经分两档（首字节前 180s、出字之后 60s），前提是「出过字 = 模型开始作答，
 * 之后的间隔只该有几秒」。这个前提在这一层【判不出来】：那个标志位是在
 * 收到任意字节时置真的，而开头那个只带 delta.role 的 chunk、SSE 的注释心跳、
 * Anthropic 的 message_start 全都算字节。于是「先吐个头 chunk 再默默推理」的
 * 模型（GPT-5.x 高推理档就是）会在 60s 那档上被掐掉 —— 推理 token 已经付过钱。
 * 想判准就得在这里认各家的载荷格式，那是适配器的活，不该往解析器里塞。
 *
 * 收紧那一档换来的是「流断了早一点报错」，代价是「正常请求被杀」。前者用户按
 * 停止就能解决，后者不能 —— 所以宁可等久一点。
 * 不设【总时长】上限：长回复本来就该跑很久，按总时长砍会砍掉正常输出。
 */
export const STALL_TIMEOUT_MS = 180_000;
export async function* parseSSE(response: Response): AsyncGenerator<string> {
  // Some CORS proxies return a 200 with an empty body; getReader() on a null
  // body would throw an opaque TypeError. Treat "no body" as "no tokens".
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let dataLines: string[] = [];

  // Strip an optional single leading space after "data:" (per SSE spec).
  const fieldValue = (line: string) => line.slice(5).replace(/^ /, '');

  // 每次 read 与一个计时器赛跑；超时抛错 → finally 里取消 reader → 错误传到
  // 调用方，由它显示重试。计时器无论哪条路径都清掉，免得留下悬空的 timer。
  const readOrStall = async (): Promise<ReadableStreamReadResult<Uint8Array>> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Stream stalled: no data for ${STALL_TIMEOUT_MS / 1000}s`)), STALL_TIMEOUT_MS);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    while (true) {
      const { done, value } = await readOrStall();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1); // CRLF

        if (line === '') {
          // Blank line → dispatch the accumulated event.
          if (dataLines.length > 0) {
            const data = dataLines.join('\n');
            dataLines = [];
            if (data === '[DONE]') return;
            yield data;
          }
        } else if (line.startsWith('data:')) {
          dataLines.push(fieldValue(line));
        }
        // Other fields (event:, id:, retry:) and comments (":") are ignored.
      }
    }

    // Flush any bytes held by the decoder (e.g. a multibyte char split across the
    // final read), then handle a final event that wasn't terminated by a blank line.
    buffer += decoder.decode();
    const tail = buffer.endsWith('\r') ? buffer.slice(0, -1) : buffer;
    if (tail.startsWith('data:')) dataLines.push(fieldValue(tail));
    if (dataLines.length > 0) {
      const data = dataLines.join('\n');
      if (data !== '[DONE]') yield data;
    }
  } finally {
    // Release the lock and cancel the body on every exit path — normal [DONE]
    // return, consumer break (abort), or error — so the connection isn't held
    // open until GC.
    reader.cancel().catch(() => {});
  }
}
