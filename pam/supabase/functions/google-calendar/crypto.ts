// The refresh token is kept encrypted (D-539): AES-GCM, a fresh 12-byte nonce each time, the key a
// function secret (GOOGLE_TOKEN_KEY, 32 random bytes in base64) that is never in the database or the repository.
// What the database holds is "v1." + base64(nonce || ciphertext); without the key it is noise.

const b64 = {
  encode: (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes)),
  decode: (text: string): Uint8Array => Uint8Array.from(atob(text), (c) => c.charCodeAt(0)),
};

export const b64url = {
  encode: (bytes: Uint8Array): string => b64.encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  decode: (text: string): Uint8Array => b64.decode(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)),
};

async function aesKey(secret: string): Promise<CryptoKey> {
  const raw = b64.decode(secret);
  if (raw.length !== 32) throw new Error('the token key is not 32 bytes');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function seal(plain: string, secret: string): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, await aesKey(secret), new TextEncoder().encode(plain)));
  const out = new Uint8Array(nonce.length + body.length);
  out.set(nonce);
  out.set(body, nonce.length);
  return `v1.${b64.encode(out)}`;
}

export async function unseal(sealed: string, secret: string): Promise<string> {
  if (!sealed.startsWith('v1.')) throw new Error('unknown token format');
  const bytes = b64.decode(sealed.slice(3));
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await aesKey(secret), bytes.slice(12));
  return new TextDecoder().decode(plain);
}

/** The sign-in's `state`: who it is for and when it stops being good, signed so nobody else can make one. */
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signState(memberId: string, expiresAt: number, secret: string): Promise<string> {
  const payload = b64url.encode(new TextEncoder().encode(`${memberId}.${expiresAt}`));
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(payload)));
  return `${payload}.${b64url.encode(mac)}`;
}

export async function verifyState(state: string, now: number, secret: string): Promise<string | null> {
  const [payload, mac] = state.split('.');
  if (!payload || !mac) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), b64url.decode(mac), new TextEncoder().encode(payload));
    if (!ok) return null;
    const [memberId, expires] = new TextDecoder().decode(b64url.decode(payload)).split('.');
    if (!memberId || !expires || Number(expires) < now) return null;
    return memberId;
  } catch {
    return null;
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
