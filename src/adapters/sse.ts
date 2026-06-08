/**
 * Parse a Server-Sent Events response, yielding one payload per event.
 *
 * Follows the SSE framing rules that matter for LLM streams: an event is a run of
 * lines terminated by a blank line; `data:` lines accumulate and are joined with
 * `\n` (so a multi-line `data:` event yields one payload, not fragments); `event:`,
 * `id:`, `retry:` and comment (`:`) lines are ignored. A trailing event with no
 * final blank line (stream closed early) is still flushed.
 */
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

  try {
    while (true) {
      const { done, value } = await reader.read();
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
