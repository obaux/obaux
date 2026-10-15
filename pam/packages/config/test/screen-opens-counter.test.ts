import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The phone's half of the screen counter (a76, D-555; Nico's `screenOpens.ts`; Lena, 13 October 2026).
 *
 * Privacy (`privacy.s.what-we-keep.p13`) says the count is of phones that opened two screens, Your points and Profile; that "your phone
 * keeps a note that stays on it" so a phone counts once a day; and, with the database half (test 71), that nothing about the person goes
 * with it. The database cannot see what the phone sends, so the phone's side is held here, from the source:
 *
 *   * the only thing sent is the screen's name, to `count_screen_open`; the note on the phone holds a date and is never sent;
 *   * only the two screens the line names can be counted (a closed type), and only from those two screens;
 *   * a demo account, example data and staff do not count (the number is of real members' phones).
 *
 * Counting a third screen is a change to Privacy first: this fails until the line, the type and this test are changed together.
 */
const WEB = fileURLToPath(new URL('../../../apps/web/src', import.meta.url));
const FILE = join(WEB, 'lib/screenOpens.ts');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'stories' || name === 'node_modules' ? [] : sources(path);
    return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) ? [path] : [];
  });
}

describe.skipIf(!existsSync(FILE))('the phone counts only what Privacy says, and sends only the screen’s name (a76)', () => {
  const code = readFileSync(FILE, 'utf8');
  const all = sources(WEB).map((path) => ({ path: path.slice(WEB.length + 1), text: readFileSync(path, 'utf8') }));

  it('can count two screens, the two Privacy names', () => {
    expect(code).toMatch(/export type CountedScreen = 'points' \| 'profile';/);
  });

  it('sends the screen’s name and nothing else: one call, one parameter', () => {
    const calls = code.match(/\.rpc\(\s*'count_screen_open'\s*,\s*\{[^}]*\}\s*\)/g) ?? [];
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatch(/\{\s*p_screen:\s*screen\s*\}/);
    expect(code, 'nothing but that call reaches the network').not.toMatch(/\bfetch\(|sendBeacon|XMLHttpRequest|new Image\(|location\.|new URL\(/);
  });

  it('keeps a note that holds this phone’s date and never sends it', () => {
    expect(code).toMatch(/const NOTE = 'pam\.counted\.';/);
    expect(code).toMatch(/setItem\(NOTE \+ screen, today\)/);
    const sent = code.slice(code.indexOf('async function callServer'), code.indexOf('/** Counts this open'));
    expect(sent, 'the note, the day and the storage must not be in what is sent').not.toMatch(/NOTE|today|dayOf|notes|localStorage/);
  });

  it('counts only a real member’s phone: not a demo account, example data or staff', () => {
    expect(code).toMatch(/state\.session\.role === 'member'/);
    expect(code).toMatch(/!state\.session\.isDemo/);
    expect(code).toMatch(/!examples/);
  });

  it('is used from Your points and Profile and nowhere else', () => {
    const users = all.filter(({ path, text }) => path !== 'lib/screenOpens.ts' && /useCountScreenOpen\(/.test(text));
    expect(users.map((u) => u.path).sort()).toEqual(['app/points/page.tsx', 'screens/ProfileScreen.tsx']);
    expect(users.map((u) => u.text.match(/useCountScreenOpen\('([a-z]+)'\)/)?.[1]).sort()).toEqual(['points', 'profile']);
  });

  it('has nothing else in the app call the counting function', () => {
    const callers = all.filter(({ path, text }) => path !== 'lib/screenOpens.ts' && /count_screen_open/.test(text)).map((f) => f.path);
    expect(callers).toEqual([]);
  });

  it('has no other note on the phone that is the counter’s: its key is in this file only', () => {
    const others = all.filter(({ path, text }) => path !== 'lib/screenOpens.ts' && /pam\.counted/.test(text)).map((f) => f.path);
    expect(others).toEqual([]);
  });
});
