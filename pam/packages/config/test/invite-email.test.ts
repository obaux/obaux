import { describe, expect, it } from 'vitest';
import { INVITE_EMAIL, renderInviteEmail } from '../src/invite-email';

const input = {
  link: 'https://pam.example/signin/?invite=ABCD2345&as=program',
  role: 'provider' as const,
  inviterFirstName: 'Dana',
  locale: 'en' as const,
  appUrl: 'https://pam.example',
};

describe('the invite email (D-263)', () => {
  it('is not sent until a person has reviewed it', () => {
    if (INVITE_EMAIL.reviewedBy) return;
    expect(() => renderInviteEmail(input)).toThrow(/reviewed/);
  });

  it('says who invited them and as what, with the link twice and the logo from the app', () => {
    const email = renderInviteEmail({ ...input, draft: true });
    expect(email.subject).toBe('Your new PAM link');
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
