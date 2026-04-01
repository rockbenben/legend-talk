export async function* parseSSE(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }

  // Flush remaining buffer (e.g., stream closed without trailing newline)
  const remaining = buffer.trim();
  if (remaining.startsWith('data: ') && remaining.slice(6) !== '[DONE]') {
    yield remaining.slice(6);
  }
}
