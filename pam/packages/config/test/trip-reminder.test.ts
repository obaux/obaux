import { describe, expect, it } from 'vitest';
import { renderSms } from '../src/sms-templates';
import { SUPPORTED_LOCALES as LOCALES } from '../src/i18n';

/**
 * The day-before text a saved trip queues (20261010074045, D-454) is filled by
 * the database — the time as "10:00 AM", the street (34 characters at most) and
 * a link to the Trips screen — and rendered later by the dispatcher from the
 * signed template. This is the pair meeting: the worst the database can queue
 * must still be a text that fits, in every language, or the dispatcher would
 * refuse it at send time and the person would simply never be reminded.
 */
const WORST_STREET = '1234 Martin Luther King Jr Blvd Ste'.slice(0, 34);

describe('the day-before text for a saved trip', () => {
  for (const app of ['https://web-ten-umber-88.vercel.app', 'https://joinpam.org']) {
    for (const locale of LOCALES) {
      it(`fits in ${locale} with the Trips link on ${app}`, () => {
        const body = renderSms({
          key: 'appointment_24h',
          locale,
          vars: { time: '12:30 PM', address: WORST_STREET, link: `${app}/trips/` },
          allowUnreviewed: true,
        });
        expect(body.startsWith('Pam:')).toBe(true);
        expect(body).toContain(`${app}/trips/`);
      });
    }
  }
});
