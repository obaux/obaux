import { describe, expect, it } from 'vitest';
import { DEFAULT_PAM_HOURS } from '@pam/config';
import { pamSystemText } from './pamMessages';

const t = (key: string, vars?: Record<string, string>) => (key === 'pam.away' ? `away:${vars?.hours}` : key);
const words = { t, tPlain: t, locale: 'en', firstName: null, hours: DEFAULT_PAM_HOURS };

describe('the out-of-hours reply', () => {
  it('says the hours that were in force when it was sent, when it carries them', () => {
    const sent = { hours: { tz: 'America/New_York', days: [1, 2, 3], open: '10:00', close: '12:00' } };
    // The line is built from the carried hours, not from today's.
    const today = pamSystemText('pam.away', words, null);
    const carried = pamSystemText('pam.away', { ...words, t: (k, v) => (k === 'pam.hours' ? `${v?.days}|${v?.open}|${v?.close}` : t(k, v)), tPlain: (k, v) => (k === 'pam.hours' ? `${v?.days}|${v?.open}|${v?.close}` : t(k, v)) }, sent);
    expect(carried).toContain('10 AM|12 PM');
    expect(today).not.toContain('10 AM');
  });
  it('says today\'s hours for one sent before it carried them', () => {
    const line = pamSystemText('pam.away', { ...words, tPlain: (k, v) => (k === 'pam.hours' ? `${v?.open}|${v?.close}` : t(k, v)) }, { opensAt: '2026-10-19T13:00:00Z' });
    expect(line).toContain('9 AM|5 PM');
  });
});
