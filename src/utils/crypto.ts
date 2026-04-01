/** AES-256-GCM encrypt/decrypt via Web Crypto API (PBKDF2 key derivation) */

async function deriveKey(password: string, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 50000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export async function encrypt(text: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
  const buf = new Uint8Array(16 + 12 + ct.length);
  buf.set(salt); buf.set(iv, 16); buf.set(ct, 28);
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

export async function decrypt(encoded: string, password: string): Promise<string> {
  const buf = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
  const key = await deriveKey(password, buf.slice(0, 16));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(16, 28) }, key, buf.slice(28));
  return new TextDecoder().decode(plain);
}
