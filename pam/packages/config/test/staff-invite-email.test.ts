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

describe('the first-invite email to a case manager or a program lead (D-450, D-461)', () => {
  it('has Will’s sign-off on the English, in his words, and the others are drafts under the 9 October convention', () => {
    expect(STAFF_INVITE_EMAIL.en.reviewedBy).toBe('Will, 10 October 2026');
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== 'en')) {
      expect(STAFF_INVITE_EMAIL[locale].reviewedBy, locale).toMatch(/^Will \(Oba\), 10 October 2026 — approved to learn from; no native reader yet$/);
    }
    expect(unsignedStaffInviteEmailLocales()).toEqual([]);
    expect(() => renderStaffInviteEmail(input)).not.toThrow();
  });

  it('says exactly what Will approved, in English', () => {
    const { copy } = STAFF_INVITE_EMAIL.en;
    expect(copy.subject).toBe("You're invited to join Pam");
    expect(copy.preheader).toBe("We'd love to have you with us.");
    expect(copy.title).toBe("You're invited to Pam");
    expect(copy.body.provider).toBe(
      'Hi! {inviter} would love for your program to be part of Pam. Pam helps people find programs like yours and plan a visit. Accept your invite to set up your program.',
    );
    expect(copy.body.admin).toBe(
      'Hi! {inviter} would love for you to join Pam as a case manager. Pam helps the people you support find services, plan visits and stay in touch with you. Accept your invite to get started.',
    );
    expect(copy.button).toBe('Accept invite');
    expect(copy.fallback).toBe("If the button doesn't work, copy this link into your browser:");
    expect(copy.footer).toBe("You're getting this because someone invited you to Pam. If it's not for you, you can just ignore it.");
  });

  it('shows who invited them and as what, with the link twice, and does not say a link ran out', () => {
    const email = renderStaffInviteEmail(input);
    expect(email.html).toContain('Hi! Dana would love for you to join Pam as a case manager.');
    expect(renderStaffInviteEmail({ ...input, role: 'provider' }).html).toContain('would love for your program to be part of Pam');
    expect(email.html).not.toMatch(/ran out|last link/i);
    expect(email.html).toContain('>Accept invite</a>');
    expect(email.html.match(/href="https:\/\/pam\.example\/signin\/\?invite=ABCD2345&amp;as=case-manager"/g)).toHaveLength(2);
  });

  it('never says how long the link lasts, in any language, in any part of the email', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const role of ['provider', 'admin'] as const) {
        const email = renderStaffInviteEmail({ ...input, locale, role });
        // The link itself carries an invite code, never a number of days: look at what a person reads.
        const read = `${email.subject}\n${email.text.replace(input.link, '')}`;
        expect(read, `${locale} ${role}`).not.toMatch(/30|\bdays?\b|\bdías\b|\bdias\b|天|日内|дн[еёя]|суток|يوم|أيام/i);
        expect(email.html, `${locale} ${role}`).not.toMatch(/preheader[^>]*>[^<]*30/);
      }
    }
  });

  it('writes the email in the person’s language while it carries an approval, and English when it does not', () => {
    expect(renderStaffInviteEmail({ ...input, locale: 'ru' }).html).toContain('Dana хочет, чтобы вы присоединились');
    expect(renderStaffInviteEmail({ ...input, locale: 'ar' }).html).toContain('dir="rtl"');
    const table = STAFF_INVITE_EMAIL as Record<string, { reviewedBy: string }>;
    const original = table['ru']!.reviewedBy;
    table['ru']!.reviewedBy = '';
    try {
      const email = renderStaffInviteEmail({ ...input, locale: 'ru' });
      expect(email.locale).toBe('en');
      expect(email.html).toBe(renderStaffInviteEmail({ ...input, locale: 'en' }).html);
      expect(unsignedStaffInviteEmailLocales()).toEqual(['ru']);
    } finally {
      table['ru']!.reviewedBy = original;
    }
  });

  it('sends nothing at all if the English loses its sign-off, and a draft still previews', () => {
    const table = STAFF_INVITE_EMAIL as Record<string, { reviewedBy: string }>;
    const original = table['en']!.reviewedBy;
    table['en']!.reviewedBy = '';
    try {
      expect(usableStaffInviteEmailLocale('ru')).toBe('ru');
      expect(usableStaffInviteEmailLocale('en')).toBeNull();
      expect(() => renderStaffInviteEmail(input)).toThrow(/not been reviewed/);
      expect(renderStaffInviteEmail({ ...input, draft: true }).locale).toBe('en');
    } finally {
      table['en']!.reviewedBy = original;
    }
  });

  it('says the same things in all seven languages: the same parts, the inviter in each, and the button as an invitation to accept', () => {
    const shape = (o: object) => JSON.stringify(Object.keys(o).sort());
    for (const locale of SUPPORTED_LOCALES) {
      const { copy } = STAFF_INVITE_EMAIL[locale];
      expect(shape(copy), locale).toBe(shape(STAFF_INVITE_EMAIL.en.copy));
      expect(shape(copy.body), locale).toBe(JSON.stringify(['admin', 'provider']));
      for (const role of ['provider', 'admin'] as const) expect(copy.body[role], `${locale} ${role}`).toContain('{inviter}');
      const email = renderStaffInviteEmail({ ...input, locale, draft: true });
      expect(email.html, locale).not.toMatch(/\{inviter\}/);
      expect(email.html, locale).toContain('Dana');
      expect(email.html, locale).toContain(`>${copy.button}</a>`);
    }
    // The button, in each language, means "Accept invite".
    expect(STAFF_INVITE_EMAIL.es.copy.button).toBe('Aceptar invitación');
    expect(STAFF_INVITE_EMAIL['pt-BR'].copy.button).toBe('Aceitar convite');
    expect(STAFF_INVITE_EMAIL['zh-CN'].copy.button).toBe('接受邀请');
    expect(STAFF_INVITE_EMAIL['zh-HK'].copy.button).toBe('接受邀請');
    expect(STAFF_INVITE_EMAIL.ru.copy.button).toBe('Принять приглашение');
    expect(STAFF_INVITE_EMAIL.ar.copy.button).toBe('اقبل الدعوة');
  });

  it('leaves the expired-link email as it was: its own button, its own link line, its 30 days', () => {
    const renewal = renderInviteEmail({ ...input, role: 'admin', draft: true });
    expect(renewal.html).toContain('>Open Pam</a>');
    expect(renewal.html).toContain('If the button does not work, copy this link into your browser:');
    expect(renewal.html).toContain('It works for 30 days.');
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
