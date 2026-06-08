import { compressToBase64, decompressFromBase64 } from '../../src/utils/compress';

describe('compress', () => {
  it('round-trips a short string', async () => {
    const s = 'hello, 世界 🌍';
    expect(await decompressFromBase64(await compressToBase64(s))).toBe(s);
  });

  it('produces URL-safe base64 (no +, /, or = padding)', async () => {
    const out = await compressToBase64('the quick brown fox '.repeat(50));
    expect(out).not.toMatch(/[+/=]/);
  });

  it('round-trips a large payload without deadlocking', async () => {
    // Guards the CompressionStream backpressure trap: awaiting write() before reading
    // would hang once compressed output exceeds the readable buffer.
    const big = 'x'.repeat(2_000_000) + '你好'.repeat(100_000);
    expect(await decompressFromBase64(await compressToBase64(big))).toBe(big);
  });
});
