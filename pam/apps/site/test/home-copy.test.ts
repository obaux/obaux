import { describe, expect, it } from 'vitest';
import { HELD, HOME } from '../src/content/home-copy';

const shown = JSON.stringify(HOME);

describe('Home words (Mira, 11 October: hold what is untrue today or a new promise)', () => {
  it('shows none of the held lines, and shows the true sentence in their place', () => {
    for (const line of HELD) {
      expect(shown.includes(JSON.stringify(line.wanted).slice(1, -1)), `${line.id} is held but on the page`).toBe(false);
      expect(shown.includes(JSON.stringify(line.shown).slice(1, -1)), `${line.id}: its true sentence is not on the page`).toBe(true);
    }
  });

  it('never promises 24/7, a call, or hours ("a real person" is Will’s, a65, 12 October: members can message programs)', () => {
    expect(shown).not.toMatch(/24\/7|call pam|monday to friday/i);
  });

  it('sends “Add your program” to sign in (Will, a65) and “Join as a case manager” to the help post until the request page exists', () => {
    const programs = HOME.rows.find((r) => r.id === 'programs')!;
    const managers = HOME.rows.find((r) => r.id === 'case-managers')!;
    expect(programs.cta.href).toBe('app');
    expect(managers.cta.href).toBe('/support/cant-sign-in/');
  });
});
