import { describe, expect, it } from 'vitest';
import {
  renderInviteEmail,
  renderStaffInviteEmail,
  STAFF_INVITE_EMAIL,
  unsignedStaffInviteEmailLocales,
  usableStaffInviteEmailLocale,
} from '../src/invite-email';
import { SUPPORTED_LOCALES, type Locale } from '../src/i18n';
import { smsTermHits } from '../src/sms-terms';

const input = {
  link: 'https://pam.example/signin/?invite=ABCD2345&as=case-manager',
  role: 'admin' as const,
  inviterFirstName: 'Dana',
  locale: 'en' as const,
  appUrl: 'https://pam.example',
};

/** Signs a language for the length of one check, the way a person would, and puts it back. */
function signed<T>(locales: Locale[], run: () => T): T {
  const table = STAFF_INVITE_EMAIL as Record<string, { copy: unknown; reviewedBy: string }>;
  const before = locales.map((l) => table[l]!.reviewedBy);
  locales.forEach((l) => (table[l]!.reviewedBy = 'a test reader'));
  try {
    return run();
  } finally {
    locales.forEach((l, i) => (table[l]!.reviewedBy = before[i]!));
  }
}

describe('the first-invite email to a case manager or a program lead (D-450)', () => {
  it('is not signed by anybody yet, so nothing sends — I never fill in reviewedBy', () => {
    expect(unsignedStaffInviteEmailLocales()).toEqual([...SUPPORTED_LOCALES]);
    expect(usableStaffInviteEmailLocale('en')).toBeNull();
    expect(() => renderStaffInviteEmail(input)).toThrow(/not been reviewed/);
  });

  it('shows a draft in a preview, in the language asked for', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const email = renderStaffInviteEmail({ ...input, locale, draft: true });
      expect(email.locale, locale).toBe(locale);
      expect(email.subject).toBe(STAFF_INVITE_EMAIL[locale].copy.subject);
    }
  });

  it('says who invited them and as what, and does not say a link ran out', () => {
    signed(['en'], () => {
      const email = renderStaffInviteEmail(input);
      expect(email.html).toContain('Dana invited you to be a case manager');
      expect(renderStaffInviteEmail({ ...input, role: 'provider' }).html).toContain('program partner');
      expect(email.html).not.toMatch(/ran out|last link/i);
      expect(email.html.match(/href="https:\/\/pam\.example\/signin\/\?invite=ABCD2345&amp;as=case-manager"/g)).toHaveLength(2);
    });
  });

  it('sends English to a language nobody has signed, and its own words once somebody has', () => {
    signed(['en'], () => {
      const email = renderStaffInviteEmail({ ...input, locale: 'ru' });
      expect(email.locale).toBe('en');
      expect(email.html).toBe(renderStaffInviteEmail({ ...input, locale: 'en' }).html);
    });
    signed(['en', 'ru', 'ar'], () => {
      expect(renderStaffInviteEmail({ ...input, locale: 'ru' }).html).toContain('Dana приглашает вас');
      expect(renderStaffInviteEmail({ ...input, locale: 'ar' }).html).toContain('dir="rtl"');
    });
  });

  it('a signed language alone does not send if English is not signed', () => {
    signed(['ru'], () => {
      expect(usableStaffInviteEmailLocale('ru')).toBe('ru');
      expect(usableStaffInviteEmailLocale('es')).toBeNull();
    });
  });

  it('says the same things in all seven languages: the same parts, the inviter and the 30 days in each', () => {
    const shape = (o: object) => JSON.stringify(Object.keys(o).sort());
    for (const locale of SUPPORTED_LOCALES) {
      const { copy } = STAFF_INVITE_EMAIL[locale];
      expect(shape(copy), locale).toBe(shape(STAFF_INVITE_EMAIL.en.copy));
      expect(shape(copy.body), locale).toBe(JSON.stringify(['admin', 'provider']));
      for (const role of ['provider', 'admin'] as const) {
        expect(copy.body[role], `${locale} ${role}`).toContain('{inviter}');
        expect(copy.body[role], `${locale} ${role}`).toMatch(/30/);
      }
      const email = renderStaffInviteEmail({ ...input, locale, draft: true });
      expect(email.html, locale).not.toMatch(/\{inviter\}/);
      expect(email.html, locale).toContain('Dana');
    }
  });

  it('takes its button and its written-out-link line from the email already approved, so the two never drift', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const first = STAFF_INVITE_EMAIL[locale].copy;
      const renewal = renderInviteEmail({ ...input, role: 'admin', locale, draft: true });
      expect(renewal.html, locale).toContain(first.button);
      expect(renewal.html, locale).toContain(first.fallback);
    }
  });

  it('never says what a member must not hear, in any language', () => {
    const roleWord: Record<Locale, string[]> = {
      en: ['case manager'],
      es: ['gestor de caso'],
      'pt-BR': ['gestor de caso'],
      'zh-CN': ['个案管理'],
      'zh-HK': ['個案經理'],
      ru: ['кейс-менеджер'],
      ar: ['مدير حالة', 'مدير الحالة'],
    };
    for (const locale of SUPPORTED_LOCALES) {
      const { copy } = STAFF_INVITE_EMAIL[locale];
      for (const [where, text] of Object.entries({ ...copy, ...copy.body })) {
        if (typeof text !== 'string') continue;
        const hits = smsTermHits(text, locale).filter((hit) => !roleWord[locale].some((ok) => ok === hit || hit.includes(ok)));
        expect(hits, `${locale} ${where}`).toEqual([]);
      }
    }
  });
});
