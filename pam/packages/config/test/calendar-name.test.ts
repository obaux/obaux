import { describe, expect, it } from 'vitest';
import { OTHER_LOCALES } from './_bundles.js';

/**
 * The name a member's calendar app shows for the linked calendar (a98 plan C, D-604; Sage signed "Visits", ledger 9190aac3).
 *
 * The feed names the calendar in the member's saved language, read when the calendar app fetches it. The six translations live
 * in the edge function (`LINK_CALENDAR_NAMES`), not in a bundle, so `copy:status` cannot see them: this is what stops one from
 * going back to the English stand-in, or a seventh language from being added to the app with no name here.
 */
describe('the linked calendar is named in each language', () => {
  it('has a name for every language Pam offers, and the six are not the English stand-in', async () => {
    const { LINK_CALENDAR_NAMES } = await import('../../../supabase/functions/calendar-feed/ics');
    for (const locale of OTHER_LOCALES) {
      expect(LINK_CALENDAR_NAMES[locale], `${locale} has a calendar name`).toBeTruthy();
      expect(LINK_CALENDAR_NAMES[locale], `${locale} is not the English stand-in`).not.toBe(LINK_CALENDAR_NAMES.en);
      expect(LINK_CALENDAR_NAMES[locale], `${locale} is one short word, it is a calendar's name`).not.toMatch(/[\r\n;,:]/);
    }
    expect(LINK_CALENDAR_NAMES.en).toBe('Visits');
  });
});
