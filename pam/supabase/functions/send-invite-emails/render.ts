// The words and the layout of a staff invite email, as the sender uses them.
//
// Pure: it takes its copy as an argument (the bundle, generated from
// packages/config/src/invite-email.ts by the zz-generate test) and imports
// nothing, so the same code that renders a real email is what the tests render
// against. The layout is the one in packages/config (`layout`); a test renders
// both and fails if they ever differ, so Storybook's preview and the real email
// say the same thing.

export type Locale = 'en' | 'es' | 'pt-BR' | 'zh-CN' | 'zh-HK' | 'ru' | 'ar';
export type StaffRole = 'provider' | 'admin';
/** The expired-link email also goes to a member who was invited (their invite expired too). */
export type InviteRole = StaffRole | 'member';

export interface Copy {
  subject: string;
  preheader: string;
  title: string;
  /** The staff first-invite wording has no member body (members are never emailed first); the expired-link one has all three. */
  body: Partial<Record<InviteRole, string>>;
  button: string;
  fallback: string;
  footer: string;
  someone: string;
}

export interface Bundle {
  /** The first email to a staff invite: each language's wording and who signed it. Empty `reviewedBy`: that language is not sent. */
  locales: Record<Locale, { reviewedBy: string; copy: Copy }>;
  /** The email with a fresh link, for someone whose link ran out (D-263, signed by Will on 4 October). Same shape. */
  linkLocales: Record<Locale, { reviewedBy: string; copy: Copy }>;
  fonts: Record<Locale, string>;
  rtl: Locale[];
}

export interface Input {
  link: string;
  role: InviteRole;
  inviterFirstName: string | null;
  locale: string;
  appUrl: string;
}

export interface Rendered {
  subject: string;
  html: string;
  text: string;
  /** The language it was written in: English when the asked-for one is not signed. */
  locale: Locale;
}

/** Nothing may be sent: no wording has been signed. Never retried until somebody signs. */
export class UnsendableError extends Error {}

const LOCALES: readonly Locale[] = ['en', 'es', 'pt-BR', 'zh-CN', 'zh-HK', 'ru', 'ar'];

/** Anything the database holds that is not one of Pam's languages is English. */
export function localeOf(value: string | null | undefined): Locale {
  return (LOCALES as readonly string[]).includes(value ?? '') ? (value as Locale) : 'en';
}

/** True when at least English has been signed, so something can be sent at all. */
export function canSend(bundle: Bundle): boolean {
  return bundle.locales.en.reviewedBy.trim() !== '';
}

/** The same for the expired-link email. */
export function canSendLink(bundle: Bundle): boolean {
  return bundle.linkLocales.en.reviewedBy.trim() !== '';
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderStaffInvite(bundle: Bundle, input: Input): Rendered {
  return renderFrom(bundle, bundle.locales, 'the invite email', input);
}

/** The email with a fresh link, for somebody whose first one ran out. */
export function renderFreshLink(bundle: Bundle, input: Input): Rendered {
  return renderFrom(bundle, bundle.linkLocales, 'the new-link email', input);
}

function renderFrom(
  bundle: Bundle,
  locales: Bundle['locales'],
  what: string,
  input: Input,
): Rendered {
  if (locales.en.reviewedBy.trim() === '') throw new UnsendableError(`${what} has not been reviewed by a person yet`);
  const wanted = localeOf(input.locale);
  const locale: Locale = locales[wanted].reviewedBy.trim() ? wanted : 'en';
  const { copy } = locales[locale];
  const dir = bundle.rtl.includes(locale) ? 'rtl' : 'ltr';
  const font = bundle.fonts[locale];
  const inviter = input.inviterFirstName?.trim() || copy.someone;
  const wording = copy.body[input.role];
  if (!wording) throw new UnsendableError(`${what} has no wording for a ${input.role}`);
  const body = wording.replace('{inviter}', inviter);
  const link = escape(input.link);
  const logo = `${input.appUrl}/email/pam-logo.png`;

  // Centred, one column, 480px at most; Pam's ink, white and its green button.
  const html = `<!doctype html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(copy.subject)}</title>
</head>
<body dir="${dir}" style="margin:0;padding:0;background-color:#f4f4f2;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(copy.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f2;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:24px;">
<tr><td align="center" style="padding:40px 32px 8px;">
<img src="${escape(logo)}" width="112" alt="Pam" style="display:block;width:112px;height:auto;border:0;">
</td></tr>
<tr><td align="center" style="padding:24px 32px 0;font-family:${font};font-size:26px;line-height:1.25;font-weight:700;color:#111111;">
${escape(copy.title)}
</td></tr>
<tr><td align="center" style="padding:16px 32px 0;font-family:${font};font-size:18px;line-height:1.5;color:#333333;">
${escape(body)}
</td></tr>
<tr><td align="center" style="padding:32px 32px 0;">
<a href="${link}" style="display:inline-block;padding:16px 40px;border-radius:999px;background-color:#0F5847;color:#ffffff;font-family:${font};font-size:18px;font-weight:700;text-decoration:none;">${escape(copy.button)}</a>
</td></tr>
<tr><td align="center" style="padding:28px 32px 0;font-family:${font};font-size:14px;line-height:1.5;color:#666666;">
${escape(copy.fallback)}<br><a href="${link}" style="color:#0F5847;word-break:break-all;">${link}</a>
</td></tr>
<tr><td align="center" style="padding:28px 32px 40px;font-family:${font};font-size:13px;line-height:1.5;color:#888888;">
${escape(copy.footer)}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [copy.title, '', body, '', `${copy.button}: ${input.link}`, '', copy.footer].join('\n');

  return { subject: copy.subject, html, text, locale };
}
