import { describe, expect, it } from 'vitest';
import { HELD, HOME } from '../src/content/home-copy';
import { ADD_PROGRAM_URL, SIGN_IN_URL } from '../src/lib/links';

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

  it('sends “Add your program” to sign in and on to Add my program (Will, a65; S1) and “Join as a case manager” to the help post until the request page exists', () => {
    const programs = HOME.rows.find((r) => r.id === 'programs')!;
    const managers = HOME.rows.find((r) => r.id === 'case-managers')!;
    expect(programs.cta.href).toBe('add-program');
    expect(managers.cta.href).toBe('/support/cant-sign-in/');
  });

  it('points “Add your program” at Sign in with only the one listed screen to go on to', () => {
    expect(ADD_PROGRAM_URL).toBe(`${SIGN_IN_URL}?next=/profile/add-program/`);
  });
});
