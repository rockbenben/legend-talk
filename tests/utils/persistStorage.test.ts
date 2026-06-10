import { persistStorage } from '../../src/utils/persistStorage';

describe('persistStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('writes to localStorage on success', async () => {
    await persistStorage.setItem('lt-test', 'v1');
    expect(localStorage.getItem('lt-test')).toBe('v1');
  });

  it('removes the stale localStorage copy when the write fails (quota)', async () => {
    // Seed an older value, then simulate quota exceeded on the next write.
    await persistStorage.setItem('lt-test', 'old');
    expect(localStorage.getItem('lt-test')).toBe('old');

    const original = localStorage.setItem.bind(localStorage);
    vi.spyOn(window.localStorage, 'setItem').mockImplementation((k: string, v: string) => {
      if (k === 'lt-test' && v === 'new') throw new DOMException('QuotaExceededError');
      original(k, v);
    });

    await persistStorage.setItem('lt-test', 'new');

    // The stale 'old' must be gone — otherwise a reload reads it from
    // localStorage and silently rolls the user back, ignoring IndexedDB.
    expect(localStorage.getItem('lt-test')).toBeNull();
  });
});
