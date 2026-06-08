/** Gzip compress a string → URL-safe base64 */
export async function compressToBase64(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  // Don't await write/close: a CompressionStream's writable backpressure is driven
  // by the readable side, so awaiting before we start reading can deadlock on large
  // inputs. The reader loop below drives the transform; .catch keeps a (never-hit in
  // practice) rejection from going unhandled.
  writer.write(encoded).catch(() => {});
  writer.close().catch(() => {});
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }
  let binary = '';
  for (let i = 0; i < compressed.length; i++) binary += String.fromCharCode(compressed[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** URL-safe base64 → gzip decompress → string */
export async function decompressFromBase64(base64: string): Promise<string> {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  // See compressToBase64: never await write/close here — the reader drives the stream.
  writer.write(bytes).catch(() => {});
  writer.close().catch(() => {});
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(result);
}
