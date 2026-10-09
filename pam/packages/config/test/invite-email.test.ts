import { describe, expect, it } from 'vitest';
import {
  INVITE_EMAIL,
  INVITE_EMAIL_MORE,
  renderInviteEmail,
  unsignedInviteEmailLocales,
  usableInviteEmailLocale,
  type InviteEmailCopy,
} from '../src/invite-email';
import { SUPPORTED_LOCALES, type Locale } from '../src/i18n';
import { smsTermHits } from '../src/sms-terms';

const input = {
  link: 'https://pam.example/signin/?invite=ABCD2345&as=program',
  role: 'provider' as const,
  inviterFirstName: 'Dana',
  locale: 'en' as const,
  appUrl: 'https://pam.example',
};

describe('the invite email (D-263)', () => {
  it('has been reviewed by a person, so it may be sent', () => {
    expect(INVITE_EMAIL.reviewedBy).not.toBe('');
    expect(() => renderInviteEmail(input)).not.toThrow();
  });

  it('says who invited them and as what, with the link twice and the logo from the app', () => {
    const email = renderInviteEmail({ ...input, draft: true });
    expect(email.subject).toBe('Your new Pam link');
    expect(email.html).toContain('Dana invited you to be a program partner');
    expect(email.html.match(/href="https:\/\/pam\.example\/signin\/\?invite=ABCD2345&amp;as=program"/g)).toHaveLength(2);
    expect(email.html).toContain('src="https://pam.example/email/pam-logo.png"');
    expect(email.text).toContain(input.link);
  });

  it('escapes what it is given', () => {
    const email = renderInviteEmail({ ...input, inviterFirstName: '<b>Dana</b>', draft: true });
    expect(email.html).not.toContain('<b>Dana</b>');
  });

  it('English and Spanish say the same things', () => {
    const keys = (o: object) => JSON.stringify(Object.keys(o).sort());
    expect(keys(INVITE_EMAIL.es)).toBe(keys(INVITE_EMAIL.en));
    expect(keys(INVITE_EMAIL.es.body)).toBe(keys(INVITE_EMAIL.en.body));
    expect(renderInviteEmail({ ...input, locale: 'es', draft: true }).html).toContain('Dana le invitó');
  });

  it('carries no words a member must never see', () => {
    const all = JSON.stringify([INVITE_EMAIL.en, INVITE_EMAIL.es]).toLowerCase();
    for (const word of ['prison', 'inmate', 'offender', 'convict', 'parole', 'probation', 'jail']) {
      expect(all).not.toContain(word);
    }
  });
});


/**
 * The email in every language Pam offers (A24, D-424).
 *
 * The five newer languages are drafts nobody who reads them has signed. Until
 * somebody has, the person is sent the English email — an email, like a text,
 * cannot be shown to someone for a second opinion first. What these hold is
 * everything short of the signature.
 */
const MORE = SUPPORTED_LOCALES.filter((l): l is Exclude<Locale, 'en' | 'es'> => l !== 'en' && l !== 'es');
const copyOf = (locale: Locale): InviteEmailCopy =>
  locale === 'en' || locale === 'es' ? INVITE_EMAIL[locale] : INVITE_EMAIL_MORE[locale].copy;

describe('the invite email in every language', () => {
  it('says the same things in all seven: same parts, same three bodies, the inviter in each', () => {
    const shape = (o: object) => JSON.stringify(Object.keys(o).sort());
    for (const locale of SUPPORTED_LOCALES) {
      const copy = copyOf(locale);
      expect(shape(copy), locale).toBe(shape(INVITE_EMAIL.en));
      expect(shape(copy.body), locale).toBe(shape(INVITE_EMAIL.en.body));
      for (const role of ['member', 'provider', 'admin'] as const) {
        expect(copy.body[role], `${locale} ${role}`).toContain('{inviter}');
        expect(copy.body[role], `${locale} ${role}`).toMatch(/30/);
      }
      for (const part of ['subject', 'preheader', 'title', 'button', 'fallback', 'footer', 'someone'] as const) {
        expect(copy[part].trim().length, `${locale} ${part}`).toBeGreaterThan(0);
      }
    }
  });

  it('carries Will’s approval on every language, worded for what it is', () => {
    // 9 October 2026: approved to learn from, no native reader yet.
    expect(unsignedInviteEmailLocales()).toEqual([]);
    for (const locale of MORE) {
      expect(INVITE_EMAIL_MORE[locale].reviewedBy, locale).toContain('Will (Oba), 9 October 2026');
      expect(INVITE_EMAIL_MORE[locale].reviewedBy, locale).toContain('no native reader yet');
      expect(usableInviteEmailLocale(locale), locale).toBe(locale);
    }
  });

  it('sends the English email once a language’s approval is emptied — each in turn', () => {
    const more = INVITE_EMAIL_MORE as Record<string, { copy: InviteEmailCopy; reviewedBy: string }>;
    for (const locale of MORE) {
      const original = more[locale]!;
      more[locale] = { ...original, reviewedBy: '' };
      try {
        expect(unsignedInviteEmailLocales(), locale).toEqual([locale]);
        expect(usableInviteEmailLocale(locale), locale).toBe('en');
        const sent = renderInviteEmail({ ...input, locale });
        const english = renderInviteEmail({ ...input, locale: 'en' });
        expect(sent.locale, locale).toBe('en');
        expect(sent.html, locale).toBe(english.html);
        expect(sent.subject, locale).toBe(english.subject);
      } finally {
        more[locale] = original;
      }
    }
  });

  it('writes the email in the person’s language while it carries an approval', () => {
    const email = renderInviteEmail({ ...input, locale: 'ru' });
    expect(email.locale).toBe('ru');
    expect(email.html).toContain('Dana приглашает вас');
    expect(email.html).toContain('lang="ru"');
    expect(renderInviteEmail({ ...input, locale: 'ar' }).html).toContain('dir="rtl"');
  });

  it('shows a draft in a preview, in the language asked for', () => {
    for (const locale of MORE) {
      const email = renderInviteEmail({ ...input, locale, draft: true });
      expect(email.locale, locale).toBe(locale);
      expect(email.html).toContain(`lang="${locale}"`);
      expect(email.subject).toBe(INVITE_EMAIL_MORE[locale].copy.subject);
      expect(email.html).toContain(INVITE_EMAIL_MORE[locale].copy.button);
    }
  });

  it('sets Arabic right to left, and nothing else', () => {
    const arabic = renderInviteEmail({ ...input, locale: 'ar', draft: true }).html;
    expect(arabic).toContain('<html lang="ar" dir="rtl">');
    expect(arabic).toContain('<body dir="rtl"');
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== 'ar')) {
      expect(renderInviteEmail({ ...input, locale, draft: true }).html, locale).toContain('dir="ltr"');
    }
  });

  it('names a font each script can be read in, without breaking the markup', () => {
    const stack = (locale: Locale) =>
      /font-family:([^;]+);font-size:26px/.exec(renderInviteEmail({ ...input, locale, draft: true }).html)?.[1] ?? '';
    expect(stack('zh-CN')).toContain('PingFang SC');
    expect(stack('zh-HK')).toContain('PingFang HK');
    expect(stack('ar')).toContain('Noto Sans Arabic');
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderInviteEmail({ ...input, locale, draft: true }).html;
      // A double quote inside a style attribute ends the attribute early.
      for (const style of html.match(/style="[^"]*"/g) ?? []) expect(style, locale).not.toMatch(/font-family:[^;]*"/);
      expect(stack(locale), locale).toMatch(/sans-serif$/);
    }
  });

  it('puts the inviter, the link and the logo in the email whatever the language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const email = renderInviteEmail({ ...input, locale, draft: true });
      expect(email.html, locale).toContain('Dana');
      expect(email.html.match(/href="https:\/\/pam\.example\/signin\/\?invite=ABCD2345&amp;as=program"/g), locale).toHaveLength(2);
      expect(email.html, locale).toContain('src="https://pam.example/email/pam-logo.png"');
      expect(email.text, locale).toContain(input.link);
      expect(email.html, locale).not.toMatch(/\{inviter\}/);
    }
  });

  it('says "someone" in the reader’s language when the inviter is not known', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const email = renderInviteEmail({ ...input, locale, inviterFirstName: null, draft: true });
      expect(email.html, locale).toContain(copyOf(locale).someone);
    }
  });

  it('never says what a member must not hear, in any language', () => {
    // The role a person is invited to is named — a case manager is one — but
    // nothing about why anybody might be joining Pam. Each language has its own
    // list; the one hit allowed is the role word in the case manager's own body.
    const caseManager: Record<Locale, string[]> = {
      en: ['case manager'],
      es: ['gestor de caso'],
      'pt-BR': ['gestor de caso'],
      'zh-CN': ['个案管理'],
      'zh-HK': ['個案經理'],
      ru: ['кейс-менеджер'],
      ar: ['مدير حالة', 'مدير الحالة'],
    };
    for (const locale of SUPPORTED_LOCALES) {
      const copy = copyOf(locale);
      const parts: [string, string][] = [
        ['subject', copy.subject],
        ['preheader', copy.preheader],
        ['title', copy.title],
        ['member', copy.body.member],
        ['provider', copy.body.provider],
        ['admin', copy.body.admin],
        ['button', copy.button],
        ['fallback', copy.fallback],
        ['footer', copy.footer],
      ];
      for (const [where, text] of parts) {
        const hits = smsTermHits(text, locale).filter(
          (term) => !(where === 'admin' && caseManager[locale].some((role) => role.includes(term) || term.includes(role))),
        );
        expect(hits, `${locale} ${where}`).toEqual([]);
      }
    }
  });
});
