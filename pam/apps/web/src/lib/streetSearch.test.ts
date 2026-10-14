import { describe, expect, it } from 'vitest';
import { askChoose, askSuggest, looksLikeAddress, wantsGoogle, wantsGoogleFromBox, zipOf } from './streetSearch';

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

/** The one search box on Explore: only an address-like text that no program matches, and never when the programs search is unsure. */
describe('wantsGoogleFromBox', () => {
  const none = { matches: 0, settled: true, ok: true };
  it('asks for an address or a corner no program matches', () => {
    expect(wantsGoogleFromBox('1500 Market', none)).toBe(true);
    expect(wantsGoogleFromBox('Broad and Girard', none)).toBe(true);
    expect(wantsGoogleFromBox('Broad & Girard', none)).toBe(true);
  });
  it('never asks for program words, whatever Pam’s areas say', () => {
    for (const text of ['food', 'job training', 'Temple Hospital', 'fishtown', '19107', '1500', 'ab']) {
      expect(wantsGoogleFromBox(text, none), text).toBe(false);
    }
  });
  it('does not ask when a program matches, even an address-like name', () => {
    expect(wantsGoogleFromBox('12 Steps Recovery', { matches: 1, settled: true, ok: true })).toBe(false);
    expect(wantsGoogleFromBox('Arts and Crafts Center', { matches: 2, settled: true, ok: true })).toBe(false);
  });
  it('does not ask while the programs search is unsettled or has failed', () => {
    expect(wantsGoogleFromBox('1500 Market', { matches: 0, settled: false, ok: true })).toBe(false);
    expect(wantsGoogleFromBox('1500 Market', { matches: 0, settled: true, ok: false })).toBe(false);
  });
  it('reads an address the same way the drawer does', () => {
    expect(looksLikeAddress('1234 N Broad St')).toBe(true);
    expect(looksLikeAddress('99999')).toBe(false);
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

describe('zipOf: what the chip says for a Google address', () => {
  it('is the 5-digit ZIP', () => {
    expect(zipOf('1500 Market St, Philadelphia, PA 19102')).toBe('19102');
    expect(zipOf('1500 Market St, Philadelphia, PA 19102-1234')).toBe('19102');
  });
  it('is not fooled by a five-digit house number', () => {
    expect(zipOf('12345 Roosevelt Blvd, Philadelphia, PA 19116')).toBe('19116');
    expect(zipOf('12345 Roosevelt Blvd, Philadelphia')).toBe('Philadelphia');
  });
  it('is "Philadelphia" with no ZIP', () => {
    expect(zipOf('Temple University Hospital, Philadelphia, PA')).toBe('Philadelphia');
    expect(zipOf('')).toBe('Philadelphia');
  });
});
