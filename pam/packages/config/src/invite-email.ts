/**
 * The email with a fresh invite link (Will, 4 October, D-263): "only ask for
 * email and email them the new invite link for their role. Let's draft an
 * email message. Format email with Pam logo on top center. Center aligned
 * email format. Simple."
 *
 * Sent when someone holding an expired link gives their address on the
 * expired-link page (`request_invite_link`, 0071). One email, one button. It
 * says who invited them and as what — the context the expired page kept —
 * and nothing about why anybody might be joining Pam: the dignity rules for
 * texts (§9) apply to email too, so no justice-related words, ever.
 *
 * Plain tables and inline styles, because that is what email clients render
 * the same way; no web fonts, no images but the logo (a PNG — several clients
 * drop SVG). The logo and the link both come from `appUrl`, so a new domain
 * changes them with everything else (docs/changing-the-domain.md).
 *
 * **Approved by Will, 4 October 2026** (`reviewedBy`). Change a word and
 * clear `reviewedBy`: `renderInviteEmail` then refuses to render it for
 * sending until a person has read it again — the same rule SMS templates
 * keep. Storybook previews it with `draft: true` either way.
 */

export type InviteEmailRole = 'member' | 'provider' | 'admin';
export type InviteEmailLocale = 'en' | 'es';

interface Copy {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: Readonly<Record<InviteEmailRole, string>>;
  readonly button: string;
  readonly fallback: string;
  readonly footer: string;
}

export const INVITE_EMAIL: {
  readonly en: Copy;
  readonly es: Copy;
  /** Who signed off on the words. Empty means not reviewed: nothing is sent. */
  readonly reviewedBy: string;
} = {
  en: {
    subject: 'Your new Pam link',
    preheader: 'Here is a new link to join Pam. It works for 30 days.',
    title: 'Here is your new link',
    body: {
      member: '{inviter} invited you to join the Pam network. Your last link ran out, so here is a new one. It works for 30 days.',
      provider: '{inviter} invited you to be a program partner in the Pam network. Your last link ran out, so here is a new one. It works for 30 days.',
      admin: '{inviter} invited you to be a case manager in the Pam network. Your last link ran out, so here is a new one. It works for 30 days.',
    },
    button: 'Open Pam',
    fallback: 'If the button does not work, copy this link into your browser:',
    footer: 'You asked for this link on Pam. If it was not you, you can ignore this email.',
  },
  es: {
    subject: 'Su nuevo enlace de Pam',
    preheader: 'Aquí tiene un enlace nuevo para unirse a Pam. Sirve por 30 días.',
    title: 'Aquí tiene su enlace nuevo',
    body: {
      member: '{inviter} le invitó a unirse a la red de Pam. Su enlace anterior se venció, así que aquí tiene uno nuevo. Sirve por 30 días.',
      provider: '{inviter} le invitó a ser un programa aliado en la red de Pam. Su enlace anterior se venció, así que aquí tiene uno nuevo. Sirve por 30 días.',
      admin: '{inviter} le invitó a ser gestor de casos en la red de Pam. Su enlace anterior se venció, así que aquí tiene uno nuevo. Sirve por 30 días.',
    },
    button: 'Abrir Pam',
    fallback: 'Si el botón no funciona, copie este enlace en su navegador:',
    footer: 'Usted pidió este enlace en Pam. Si no fue usted, puede ignorar este correo.',
  },
  reviewedBy: 'Will (Oba), 4 October 2026',
};

export interface InviteEmailInput {
  /** The invite link, already built (`inviteLink()` in the web app). */
  readonly link: string;
  readonly role: InviteEmailRole;
  /** The inviter's first name; "Someone" / "Alguien" when unknown. */
  readonly inviterFirstName: string | null;
  readonly locale: InviteEmailLocale;
  /** Where Pam lives, for the logo. No trailing slash. */
  readonly appUrl: string;
  /** Render a draft anyway — for previews only, never for sending. */
  readonly draft?: boolean;
}

export interface RenderedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderInviteEmail(input: InviteEmailInput): RenderedEmail {
  if (!INVITE_EMAIL.reviewedBy && !input.draft) {
    throw new Error('The invite email has not been reviewed by a person yet (INVITE_EMAIL.reviewedBy)');
  }
  const copy = INVITE_EMAIL[input.locale];
  const inviter = input.inviterFirstName?.trim() || (input.locale === 'es' ? 'Alguien' : 'Someone');
  const body = copy.body[input.role].replace('{inviter}', inviter);
  const link = escape(input.link);
  const logo = `${input.appUrl}/email/pam-logo.png`;

  // Centred, one column, 480px at most; Pam's ink, white and its green button.
  const html = `<!doctype html>
<html lang="${input.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f2;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(copy.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f2;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:24px;">
<tr><td align="center" style="padding:40px 32px 8px;">
<img src="${escape(logo)}" width="112" alt="Pam" style="display:block;width:112px;height:auto;border:0;">
</td></tr>
<tr><td align="center" style="padding:24px 32px 0;font-family:Helvetica,Arial,sans-serif;font-size:26px;line-height:1.25;font-weight:700;color:#111111;">
${escape(copy.title)}
</td></tr>
<tr><td align="center" style="padding:16px 32px 0;font-family:Helvetica,Arial,sans-serif;font-size:18px;line-height:1.5;color:#333333;">
${escape(body)}
</td></tr>
<tr><td align="center" style="padding:32px 32px 0;">
<a href="${link}" style="display:inline-block;padding:16px 40px;border-radius:999px;background-color:#0F5847;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;text-decoration:none;">${escape(copy.button)}</a>
</td></tr>
<tr><td align="center" style="padding:28px 32px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#666666;">
${escape(copy.fallback)}<br><a href="${link}" style="color:#0F5847;word-break:break-all;">${link}</a>
</td></tr>
<tr><td align="center" style="padding:28px 32px 40px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;color:#888888;">
${escape(copy.footer)}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [copy.title, '', body, '', `${copy.button}: ${input.link}`, '', copy.footer].join('\n');

  return { subject: copy.subject, html, text };
}
