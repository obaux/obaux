// Twilio's request signature, so only Twilio can tell Pam somebody replied STOP.
//
// Twilio signs every webhook: HMAC-SHA1, keyed with the account's auth token, of
// the exact URL it called followed by every form field as name then value, the
// fields sorted by name; base64, in the `X-Twilio-Signature` header. Pure and
// dependency-free (Web Crypto only) so the same code runs in the function and in
// the test, against signatures worked out by hand.

const encoder = new TextEncoder();

export async function twilioSignature(authToken: string, url: string, params: Readonly<Record<string, string>>): Promise<string> {
  const data = Object.keys(params)
    .sort()
    .reduce((text, key) => text + key + params[key], url);
  const key = await crypto.subtle.importKey('raw', encoder.encode(authToken), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)));
  let binary = '';
  for (const byte of mac) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Compares two strings without stopping at the first difference. */
export function sameSignature(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}
