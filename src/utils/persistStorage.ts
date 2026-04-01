/**
 * IndexedDB-first storage adapter for Zustand persist.
 * Solves WeChat in-app browser and other WebViews where localStorage is restricted/cleared.
 *
 * Read:  localStorage (sync, fast) → IndexedDB fallback
 * Write: both (localStorage may silently fail)
 */
import { get, set, del, clear, createStore } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

const store = createStore('legend-talk', 'kv');

function tryLS(action: 'get', key: string): string | null;
function tryLS(action: 'set', key: string, value: string): void;
function tryLS(action: 'remove', key: string): void;
function tryLS(action: string, key: string, value?: string): string | null | void {
  try {
    if (action === 'get') return localStorage.getItem(key);
    if (action === 'set') localStorage.setItem(key, value!);
    if (action === 'remove') localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
  }
  return null;
}

export const persistStorage: StateStorage = {
  getItem: async (name) => {
    const local = tryLS('get', name);
    if (local !== null) return local;
    try {
      const val = await get<string>(name, store);
      if (val != null) tryLS('set', name, val); // backfill
      return val ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    tryLS('set', name, value);
    try { await set(name, value, store); } catch { /* ok */ }
  },
  removeItem: async (name) => {
    tryLS('remove', name);
    try { await del(name, store); } catch { /* ok */ }
  },
};

/** Clear all app data from both localStorage and IndexedDB */
export async function clearAllStorage(): Promise<void> {
  try { localStorage.clear(); } catch { /* ok */ }
  try { sessionStorage.removeItem('legend-talk-no-shorten'); } catch { /* ok */ }
  try { await clear(store); } catch { /* ok */ }
}
