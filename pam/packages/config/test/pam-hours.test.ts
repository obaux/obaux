import { describe, expect, it } from 'vitest';
import { DEFAULT_PAM_HOURS, pamDaysLine, pamHoursLine, parsePamHours } from '../src/pamHours.js';

// Sage's templates (a2696fa8), as the English bundle will hold them.
const EN: Record<string, string> = {
  'pam.hours': '{days}, {open} to {close} {zone} time',
  'pam.hours.days.range': '{first} to {last}',
  'pam.hours.days.every': 'Every day',
  'pam.hours.zone.eastern': 'Eastern',
};
const t = (key: string, vars: Record<string, string> = {}) =>
  (EN[key] ?? key).replace(/\{(\w+)\}/g, (_, name: string) => vars[name] ?? `{${name}}`);

describe('pamHoursLine (D-605)', () => {
  it('reads the default as Sage wrote it', () => {
    expect(pamHoursLine(DEFAULT_PAM_HOURS, 'en', t)).toMatch(/^Monday to Friday, 9\s?AM to 5\s?PM Eastern time$/);
  });

  it('puts the city in for any zone but New York, and keeps minutes when there are some', () => {
    const line = pamHoursLine({ tz: 'America/Chicago', days: [1, 3, 5], open: '10:30', close: '12:00' }, 'en', t);
    expect(line).toMatch(/^Monday, Wednesday,? and Friday, 10:30\s?AM to 12\s?PM Chicago time$/);
  });

  it('says a single day by name, every day as "Every day", and days in a row as a range', () => {
    expect(pamDaysLine([6], 'en', t)).toBe('Saturday');
    expect(pamDaysLine([1, 2, 3, 4, 5, 6, 7], 'en', t)).toBe('Every day');
    expect(pamDaysLine([2, 3, 4], 'en', t)).toBe('Tuesday to Thursday');
  });

  it('uses the reader\'s own language and time format', () => {
    expect(pamDaysLine([1, 3, 5], 'es', t)).toMatch(/lunes, miércoles y viernes/);
    expect(pamHoursLine(DEFAULT_PAM_HOURS, 'de', t)).toMatch(/09 Uhr to 17 Uhr|9 Uhr to 17 Uhr/);
  });

  it('is the same whichever order the days arrive in, and ignores repeats', () => {
    expect(pamDaysLine([5, 1, 3, 3], 'en', t)).toBe(pamDaysLine([1, 3, 5], 'en', t));
  });
});

describe('parsePamHours', () => {
  it('reads the stored JSON', () => {
    expect(parsePamHours('{"tz":"America/Chicago","days":[3,1],"open":"10:30","close":"12:00"}')).toEqual({
      tz: 'America/Chicago', days: [1, 3], open: '10:30', close: '12:00',
    });
  });
  it('falls back to Will\'s default for anything missing or wrong, a part at a time', () => {
    expect(parsePamHours(null)).toEqual(DEFAULT_PAM_HOURS);
    expect(parsePamHours('not json')).toEqual(DEFAULT_PAM_HOURS);
    expect(parsePamHours('{"days":[9,0],"open":5}')).toEqual(DEFAULT_PAM_HOURS);
    expect(parsePamHours({ tz: 'America/Denver' })).toEqual({ ...DEFAULT_PAM_HOURS, tz: 'America/Denver' });
  });
});
