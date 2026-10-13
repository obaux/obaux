import { describe, expect, it } from 'vitest';
import { askChoose, askSuggest, wantsGoogle } from './streetSearch';

/** When Google is asked about what somebody typed in the area search, and what is done with its answer (D-552). */
describe('wantsGoogle', () => {
  it('asks for an address that starts with a number and a street', () => {
    expect(wantsGoogle('1500 Market', 8)).toBe(true);
    expect(wantsGoogle('  1234 N Broad St ', 8)).toBe(true);
  });
  it('asks for a corner, however it is written', () => {
    for (const text of ['Broad and Erie', 'Broad & Erie', 'Broad/Erie', 'Broad at Erie', 'BROAD AND ERIE']) {
      expect(wantsGoogle(text, 8), text).toBe(true);
    }
  });
  it('asks when Pam has no match for what was typed', () => {
    expect(wantsGoogle('Temple Hospital', 0)).toBe(true);
  });
  it('does not ask when Pam’s own list answers: a ZIP, a neighborhood', () => {
    expect(wantsGoogle('19107', 1)).toBe(false);
    expect(wantsGoogle('fishtown', 2)).toBe(false);
    expect(wantsGoogle('kens', 5)).toBe(false);
  });
  it('never asks for a bare number, even when Pam has no match', () => {
    expect(wantsGoogle('99999', 0)).toBe(false);
    expect(wantsGoogle('1500', 0)).toBe(false);
  });
  it('never asks for fewer than three characters', () => {
    expect(wantsGoogle('', 0)).toBe(false);
    expect(wantsGoogle('ab', 0)).toBe(false);
    expect(wantsGoogle('a&b', 0)).toBe(true);
  });
});

describe('the calls', () => {
  it('says off when the function has no key, and never an error', async () => {
    const off = await askSuggest(async () => ({ data: { enabled: false }, error: null }), '1500 Market', 'tok');
    expect(off).toEqual({ kind: 'off' });
  });
  it('gives the suggestions, and none on an error', async () => {
    const some = await askSuggest(async () => ({ data: { enabled: true, suggestions: [{ placeId: 'p', label: 'l' }] }, error: null }), 'q', 't');
    expect(some).toEqual({ kind: 'ok', value: [{ placeId: 'p', label: 'l' }] });
    expect(await askSuggest(async () => ({ data: null, error: new Error('x') }), 'q', 't')).toEqual({ kind: 'none' });
  });
  it('sends only the words and the token, then only the id and the token', async () => {
    const sent: unknown[] = [];
    const invoke = async (_name: string, options: { body: Record<string, unknown> }) => {
      sent.push(options.body);
      return { data: { place: { label: 'x', lat: 39.95, lon: -75.16 } }, error: null };
    };
    await askSuggest(invoke, '1500 Market', 'tok');
    await askChoose(invoke, 'place-id', 'tok');
    expect(sent).toEqual([
      { action: 'suggest', q: '1500 Market', token: 'tok' },
      { action: 'choose', placeId: 'place-id', token: 'tok' },
    ]);
  });
  it('gives a point only when the function gave one', async () => {
    expect(await askChoose(async () => ({ data: { place: null }, error: null }), 'p', 't')).toBeNull();
    expect(await askChoose(async () => ({ data: { place: { label: 'x', lat: 1, lon: 2 } }, error: null }), 'p', 't')).toEqual({ label: 'x', lat: 1, lon: 2 });
  });
});
