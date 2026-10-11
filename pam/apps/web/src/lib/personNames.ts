'use client';

/**
 * A first name carried from one page about a person to the next without putting
 * it in the address (D-536): an address lands in the host's request records and
 * in browser history; this stays in the tab and is gone when it closes.
 */
const KEY = 'pam.personNames';

function read(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function rememberPersonName(id: string, firstName: string): void {
  if (!id || !firstName) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: firstName }));
  } catch {
    // Not remembered is a page that says "Someone", not a broken one.
  }
}

export function recalledPersonName(id: string): string | null {
  return read()[id] ?? null;
}
