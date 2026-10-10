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
 *
 * **In every language Pam offers (A24, D-424).** English and Spanish are
 * signed above. The other five are drafts (`INVITE_EMAIL_MORE`, each with its
 * own empty `reviewedBy`): the email goes to a person in the language they
 * asked for the link in (`invite_emails.locale`, 0085), and **until a person
 * who reads that language has signed its wording, that person gets the
 * English email** — never a draft; an email cannot be shown to somebody for a
 * second opinion. `renderInviteEmail` makes that choice itself and says which
 * language it used. Right-to-left languages are set right to left, and each
 * script gets a font stack its readers' devices have, since an email cannot
 * load a font.
 */

import type { Locale } from './i18n.js';
import { APPROVED_TO_LEARN_FROM } from './sms-templates.js';

export type InviteEmailRole = 'member' | 'provider' | 'admin';
export type InviteEmailLocale = Locale;
export type MoreInviteEmailLocale = Exclude<Locale, 'en' | 'es'>;

export interface InviteEmailCopy {
  readonly subject: string;
  readonly preheader: string;
  readonly title: string;
  readonly body: Readonly<Record<InviteEmailRole, string>>;
  readonly button: string;
  readonly fallback: string;
  readonly footer: string;
  /** Said in place of the inviter's name when it is not known. */
  readonly someone: string;
}

export const INVITE_EMAIL: {
  readonly en: InviteEmailCopy;
  readonly es: InviteEmailCopy;
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
    someone: 'Someone',
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
    someone: 'Alguien',
  },
  reviewedBy: 'Will (Oba), 4 October 2026',
};

/**
 * The same email in the languages added on 9 October 2026 (A24). Drafted by a
 * model; **approved by Will to learn from** the same day (`APPROVED_TO_LEARN_FROM`:
 * no native reader yet), so the person gets the email in their language and it is
 * fixed when somebody who reads it says it is wrong. Empty `reviewedBy` for a
 * language sends that language the English email again. Only a person fills it in.
 *
 * The words for the roles are the ones the sign-in screen already uses for the
 * same invitation (`signin.invited.*`), so the email and the page it opens
 * agree. Russian says "invites you" (present tense) because the past tense
 * must say whether the inviter is a man or a woman, and the database does not
 * know.
 */
export const INVITE_EMAIL_MORE: Readonly<
  Record<MoreInviteEmailLocale, { readonly copy: InviteEmailCopy; readonly reviewedBy: string }>
> = {
  'pt-BR': {
    reviewedBy: APPROVED_TO_LEARN_FROM,
    copy: {
      subject: 'Seu novo link do Pam',
      preheader: 'Aqui está um novo link para entrar no Pam. Ele vale por 30 dias.',
      title: 'Aqui está o seu novo link',
      body: {
        member: '{inviter} convidou você para entrar na rede de Pam. Seu último link venceu, então aqui está um novo. Ele vale por 30 dias.',
        provider: '{inviter} convidou você para ser um programa parceiro na rede de Pam. Seu último link venceu, então aqui está um novo. Ele vale por 30 dias.',
        admin: '{inviter} convidou você para ser gestor de casos na rede de Pam. Seu último link venceu, então aqui está um novo. Ele vale por 30 dias.',
      },
      button: 'Abrir o Pam',
      fallback: 'Se o botão não funcionar, copie este link no seu navegador:',
      footer: 'Você pediu este link no Pam. Se não foi você, pode ignorar este e-mail.',
      someone: 'Alguém',
    },
  },
  'zh-CN': {
    reviewedBy: APPROVED_TO_LEARN_FROM,
    copy: {
      subject: '您的新 Pam 链接',
      preheader: '这是加入 Pam 的新链接，有效期 30 天。',
      title: '这是您的新链接',
      body: {
        member: '{inviter}邀请您加入 Pam 网络。您之前的链接已过期，这里是一个新的，有效期 30 天。',
        provider: '{inviter}邀请您成为 Pam 网络中的项目合作方。您之前的链接已过期，这里是一个新的，有效期 30 天。',
        admin: '{inviter}邀请您成为 Pam 网络中的个案管理员。您之前的链接已过期，这里是一个新的，有效期 30 天。',
      },
      button: '打开 Pam',
      fallback: '如果按钮无法使用，请将此链接复制到浏览器：',
      footer: '您在 Pam 上申请了这个链接。如果不是您本人，请忽略这封邮件。',
      someone: '有人',
    },
  },
  'zh-HK': {
    reviewedBy: APPROVED_TO_LEARN_FROM,
    copy: {
      subject: '您的新 Pam 連結',
      preheader: '這是加入 Pam 的新連結，有效期 30 天。',
      title: '這是您的新連結',
      body: {
        member: '{inviter}邀請您加入 Pam 網絡。您之前的連結已過期，這裏是新的連結，有效期 30 天。',
        provider: '{inviter}邀請您成為 Pam 網絡中的計劃夥伴。您之前的連結已過期，這裏是新的連結，有效期 30 天。',
        admin: '{inviter}邀請您成為 Pam 網絡中的個案經理。您之前的連結已過期，這裏是新的連結，有效期 30 天。',
      },
      button: '開啟 Pam',
      fallback: '如果按鈕無法使用，請把此連結複製到瀏覽器：',
      footer: '您曾在 Pam 要求這個連結。如果不是您本人，請忽略這封電郵。',
      someone: '某人',
    },
  },
  ru: {
    reviewedBy: APPROVED_TO_LEARN_FROM,
    copy: {
      subject: 'Ваша новая ссылка Pam',
      preheader: 'Вот новая ссылка, чтобы присоединиться к Pam. Она действует 30 дней.',
      title: 'Вот ваша новая ссылка',
      body: {
        member: '{inviter} приглашает вас присоединиться к сети Pam. Срок действия прошлой ссылки истёк, поэтому вот новая. Она действует 30 дней.',
        provider: '{inviter} приглашает вас в сеть Pam как партнёрскую программу. Срок действия прошлой ссылки истёк, поэтому вот новая. Она действует 30 дней.',
        admin: '{inviter} приглашает вас стать кейс-менеджером в сети Pam. Срок действия прошлой ссылки истёк, поэтому вот новая. Она действует 30 дней.',
      },
      button: 'Открыть Pam',
      fallback: 'Если кнопка не работает, скопируйте эту ссылку в браузер:',
      footer: 'Вы запросили эту ссылку в Pam. Если это были не вы, просто проигнорируйте это письмо.',
      someone: 'Кто-то',
    },
  },
  ar: {
    reviewedBy: APPROVED_TO_LEARN_FROM,
    copy: {
      subject: 'رابط Pam الجديد الخاص بك',
      preheader: 'إليك رابطا جديدا للانضمام إلى Pam. يعمل لمدة 30 يوما.',
      title: 'إليك رابطك الجديد',
      body: {
        member: 'دعاك {inviter} للانضمام إلى شبكة Pam. انتهت صلاحية رابطك السابق، لذا إليك رابطا جديدا. يعمل لمدة 30 يوما.',
        provider: 'دعاك {inviter} لتكون شريك برنامج في شبكة Pam. انتهت صلاحية رابطك السابق، لذا إليك رابطا جديدا. يعمل لمدة 30 يوما.',
        admin: 'دعاك {inviter} لتكون مدير حالة في شبكة Pam. انتهت صلاحية رابطك السابق، لذا إليك رابطا جديدا. يعمل لمدة 30 يوما.',
      },
      button: 'افتح Pam',
      fallback: 'إذا لم يعمل الزر، انسخ هذا الرابط إلى متصفحك:',
      footer: 'لقد طلبت هذا الرابط على Pam. إذا لم تكن أنت، يمكنك تجاهل هذه الرسالة.',
      someone: 'شخص ما',
    },
  },
};

/** Languages written right to left. */
export const RIGHT_TO_LEFT: readonly Locale[] = ['ar'];

/**
 * A font stack for each script. An email cannot load a font, so each names the
 * ones that the readers' phones and mail apps already have, then falls back to
 * the generic family for the script rather than to a Latin face with no glyphs.
 */
export const FONT_STACK: Readonly<Record<Locale, string>> = {
  en: 'Helvetica,Arial,sans-serif',
  es: 'Helvetica,Arial,sans-serif',
  'pt-BR': 'Helvetica,Arial,sans-serif',
  ru: 'Helvetica,Arial,sans-serif',
  'zh-CN': "'PingFang SC','Microsoft YaHei','Noto Sans SC','Hiragino Sans GB',Helvetica,Arial,sans-serif",
  'zh-HK': "'PingFang HK','PingFang TC','Microsoft JhengHei','Noto Sans TC',Helvetica,Arial,sans-serif",
  ar: "'Segoe UI','Noto Sans Arabic','Geeza Pro',Tahoma,Arial,sans-serif",
};

function wordingOf(locale: Locale): { copy: InviteEmailCopy; reviewedBy: string } {
  if (locale === 'en' || locale === 'es') {
    return { copy: INVITE_EMAIL[locale], reviewedBy: INVITE_EMAIL.reviewedBy };
  }
  return INVITE_EMAIL_MORE[locale];
}

/**
 * The language an email to this person is written in: the one they asked for
 * when somebody who reads it has signed it, English when not.
 */
export function usableInviteEmailLocale(wanted: Locale): Locale {
  return wordingOf(wanted).reviewedBy ? wanted : 'en';
}

/** The languages whose email wording nobody has signed yet: what is left to read. */
export function unsignedInviteEmailLocales(): MoreInviteEmailLocale[] {
  return (Object.keys(INVITE_EMAIL_MORE) as MoreInviteEmailLocale[]).filter(
    (locale) => !INVITE_EMAIL_MORE[locale].reviewedBy,
  );
}

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
  /** The language it was actually written in: English when the asked-for one is not signed. */
  readonly locale: Locale;
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderInviteEmail(input: InviteEmailInput): RenderedEmail {
  if (!INVITE_EMAIL.reviewedBy && !input.draft) {
    throw new Error('The invite email has not been reviewed by a person yet (INVITE_EMAIL.reviewedBy)');
  }
  // A preview shows the language asked for, drafts and all; anything that
  // sends gets a language somebody has signed.
  const locale = input.draft ? input.locale : usableInviteEmailLocale(input.locale);
  const { copy } = wordingOf(locale);
  const inviter = input.inviterFirstName?.trim() || copy.someone;
  return layout({
    locale,
    copy,
    body: copy.body[input.role].replace('{inviter}', inviter),
    link: input.link,
    appUrl: input.appUrl,
  });
}

/** The one layout every Pam email shares: the logo, a title, a sentence, a button, the link written out, a footer. */
function layout(input: {
  readonly locale: Locale;
  readonly copy: Omit<InviteEmailCopy, 'body'>;
  readonly body: string;
  readonly link: string;
  readonly appUrl: string;
}): RenderedEmail {
  const { locale, copy, body } = input;
  const dir = RIGHT_TO_LEFT.includes(locale) ? 'rtl' : 'ltr';
  const font = FONT_STACK[locale];
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

// ---------------------------------------------------------------------------
// The first invite (D-450, D-461): a case manager or a program lead is invited,
// with the email the inviter typed (0086). Not the expired-link email above —
// that one says "your last link ran out", which is not true of a first invite.
//
// **English approved by Will, 10 October 2026**, in these words: "Staff email:
// No need to mention expiry days. Invite CTA button should say Accept Invite.
// Remember we're a human-touch company. Speak human please. Then approved." So:
// no days anywhere, in any language; the button says Accept invite; it talks like
// a person. The other six languages carry the same warmth and meaning and are
// drafts under the 9 October convention (D-429): approved to learn from, no native
// reader yet, and fixed when somebody who reads the language says so. Members are
// never emailed: they are not asked for an address (D-441).
//
// The fallback line is this email's own, so the expired-link email is untouched.
// Same dignity rules as every Pam email: the role is named; nothing says why
// anyone might be joining Pam.

export type StaffInviteEmailRole = 'provider' | 'admin';

export interface StaffInviteEmailCopy extends Omit<InviteEmailCopy, 'body'> {
  readonly body: Readonly<Record<StaffInviteEmailRole, string>>;
}

export interface StaffInviteEmailWording {
  readonly copy: StaffInviteEmailCopy;
  /** Who signed off on these words. Empty means not reviewed: this language is not sent. */
  readonly reviewedBy: string;
}

/** Will's own sign-off, on the English words above. */
const STAFF_INVITE_EMAIL_REVIEWED_BY = 'Will, 10 October 2026';

/** The other six, on the 9 October convention, dated the day their words were written. */
const STAFF_INVITE_EMAIL_LEARN_FROM = 'Will (Oba), 10 October 2026 — approved to learn from; no native reader yet';

export const STAFF_INVITE_EMAIL: Readonly<Record<Locale, StaffInviteEmailWording>> = {
  en: {
    reviewedBy: STAFF_INVITE_EMAIL_REVIEWED_BY,
    copy: {
      subject: "You're invited to join Pam",
      preheader: "We'd love to have you with us.",
      title: "You're invited to Pam",
      body: {
        provider:
          'Hi! {inviter} would love for your program to be part of Pam. Pam helps people find programs like yours and plan a visit. Accept your invite to set up your program.',
        admin:
          'Hi! {inviter} would love for you to join Pam as a case manager. Pam helps the people you support find services, plan visits and stay in touch with you. Accept your invite to get started.',
      },
      button: 'Accept invite',
      fallback: "If the button doesn't work, copy this link into your browser:",
      footer: "You're getting this because someone invited you to Pam. If it's not for you, you can just ignore it.",
      someone: INVITE_EMAIL.en.someone,
    },
  },
  es: {
    reviewedBy: STAFF_INVITE_EMAIL_LEARN_FROM,
    copy: {
      subject: 'Le invitamos a unirse a Pam',
      preheader: 'Nos encantaría contar con usted.',
      title: 'Le invitaron a Pam',
      body: {
        provider:
          '¡Hola! {inviter} quiere que su programa forme parte de Pam. Pam ayuda a las personas a encontrar programas como el suyo y a planear una visita. Acepte su invitación para configurar su programa.',
        admin:
          '¡Hola! {inviter} quiere que usted se una a Pam como gestor de casos. Pam ayuda a las personas a las que usted apoya a encontrar servicios, planear visitas y mantenerse en contacto con usted. Acepte su invitación para empezar.',
      },
      button: 'Aceptar invitación',
      fallback: 'Si el botón no funciona, copie este enlace en su navegador:',
      footer: 'Recibe este correo porque alguien le invitó a Pam. Si no es para usted, puede ignorarlo.',
      someone: INVITE_EMAIL.es.someone,
    },
  },
  'pt-BR': {
    reviewedBy: STAFF_INVITE_EMAIL_LEARN_FROM,
    copy: {
      subject: 'Convite para entrar no Pam',
      preheader: 'Adoraríamos ter você com a gente.',
      title: 'Convite para o Pam',
      body: {
        provider:
          'Oi! {inviter} adoraria que o seu programa fizesse parte do Pam. O Pam ajuda as pessoas a encontrar programas como o seu e a planejar uma visita. Aceite o convite para configurar o seu programa.',
        admin:
          'Oi! {inviter} adoraria que você entrasse no Pam como gestor de casos. O Pam ajuda as pessoas que você apoia a encontrar serviços, planejar visitas e manter contato com você. Aceite o convite para começar.',
      },
      button: 'Aceitar convite',
      fallback: 'Se o botão não funcionar, copie este link no seu navegador:',
      footer: 'Você recebeu este e-mail porque alguém convidou você para o Pam. Se não é para você, pode simplesmente ignorá-lo.',
      someone: INVITE_EMAIL_MORE['pt-BR'].copy.someone,
    },
  },
  'zh-CN': {
    reviewedBy: STAFF_INVITE_EMAIL_LEARN_FROM,
    copy: {
      subject: '邀请您加入 Pam',
      preheader: '我们很期待您的加入。',
      title: '您收到了 Pam 的邀请',
      body: {
        provider: '您好！{inviter}希望您的项目能加入 Pam。Pam 帮助人们找到像您这样的项目，并安排到访。接受邀请，开始设置您的项目。',
        admin: '您好！{inviter}希望您以个案管理员的身份加入 Pam。Pam 帮助您服务的人找到服务、安排到访，并与您保持联系。接受邀请，即可开始。',
      },
      button: '接受邀请',
      fallback: '如果按钮无法使用，请将此链接复制到浏览器：',
      footer: '您收到这封邮件，是因为有人邀请您加入 Pam。如果与您无关，直接忽略即可。',
      someone: INVITE_EMAIL_MORE['zh-CN'].copy.someone,
    },
  },
  'zh-HK': {
    reviewedBy: STAFF_INVITE_EMAIL_LEARN_FROM,
    copy: {
      subject: '邀請您加入 Pam',
      preheader: '我們很期待您的加入。',
      title: '您收到 Pam 的邀請',
      body: {
        provider: '您好！{inviter}希望您的計劃加入 Pam。Pam 幫助大家找到像您這樣的計劃，並安排到訪。接受邀請，開始設定您的計劃。',
        admin: '您好！{inviter}希望您以個案經理的身份加入 Pam。Pam 幫助您服務的人找到服務、安排到訪，並與您保持聯絡。接受邀請，即可開始。',
      },
      button: '接受邀請',
      fallback: '如果按鈕無法使用，請把此連結複製到瀏覽器：',
      footer: '您收到這封電郵，是因為有人邀請您加入 Pam。如果與您無關，直接忽略即可。',
      someone: INVITE_EMAIL_MORE['zh-HK'].copy.someone,
    },
  },
  ru: {
    reviewedBy: STAFF_INVITE_EMAIL_LEARN_FROM,
    copy: {
      subject: 'Приглашение в Pam',
      preheader: 'Мы будем рады видеть вас с нами.',
      title: 'Вас приглашают в Pam',
      body: {
        provider:
          'Здравствуйте! {inviter} хочет, чтобы ваша программа стала частью Pam. Pam помогает людям находить такие программы, как ваша, и планировать визит. Примите приглашение, чтобы настроить свою программу.',
        admin:
          'Здравствуйте! {inviter} хочет, чтобы вы присоединились к Pam как кейс-менеджер. Pam помогает людям, которых вы поддерживаете, находить услуги, планировать визиты и оставаться с вами на связи. Примите приглашение, чтобы начать.',
      },
      button: 'Принять приглашение',
      fallback: 'Если кнопка не работает, скопируйте эту ссылку в браузер:',
      footer: 'Вы получили это письмо, потому что кто-то пригласил вас в Pam. Если оно не для вас, просто проигнорируйте его.',
      someone: INVITE_EMAIL_MORE.ru.copy.someone,
    },
  },
  ar: {
    reviewedBy: STAFF_INVITE_EMAIL_LEARN_FROM,
    copy: {
      subject: 'دعوة للانضمام إلى Pam',
      preheader: 'يسعدنا أن تكون معنا.',
      title: 'لقد تمت دعوتك إلى Pam',
      body: {
        provider: 'مرحبا! يتمنى {inviter} أن يكون برنامجك جزءا من Pam. يساعد Pam الناس على العثور على برامج مثل برنامجك وعلى التخطيط لزيارة. اقبل دعوتك لإعداد برنامجك.',
        admin: 'مرحبا! يتمنى {inviter} أن تنضم إلى Pam بصفتك مدير حالة. يساعد Pam الأشخاص الذين تدعمهم على العثور على الخدمات والتخطيط للزيارات والبقاء على تواصل معك. اقبل دعوتك للبدء.',
      },
      button: 'اقبل الدعوة',
      fallback: 'إذا لم يعمل الزر، انسخ هذا الرابط إلى متصفحك:',
      footer: 'وصلتك هذه الرسالة لأن شخصا ما دعاك إلى Pam. إذا لم تكن الرسالة لك، يمكنك تجاهلها ببساطة.',
      someone: INVITE_EMAIL_MORE.ar.copy.someone,
    },
  },
};

/**
 * The language a first-invite email is written in: the one asked for when
 * somebody who reads it has signed it, English when not, and `null` when not
 * even English is signed — then nothing is sent.
 */
export function usableStaffInviteEmailLocale(wanted: Locale): Locale | null {
  if (STAFF_INVITE_EMAIL[wanted].reviewedBy) return wanted;
  return STAFF_INVITE_EMAIL.en.reviewedBy ? 'en' : null;
}

/** The languages whose first-invite wording nobody has signed: what is left to read. */
export function unsignedStaffInviteEmailLocales(): Locale[] {
  return (Object.keys(STAFF_INVITE_EMAIL) as Locale[]).filter((l) => !STAFF_INVITE_EMAIL[l].reviewedBy);
}

export interface StaffInviteEmailInput extends Omit<InviteEmailInput, 'role'> {
  readonly role: StaffInviteEmailRole;
}

export function renderStaffInviteEmail(input: StaffInviteEmailInput): RenderedEmail {
  const locale = input.draft ? input.locale : usableStaffInviteEmailLocale(input.locale);
  if (!locale) {
    throw new Error('The first-invite email has not been reviewed by a person yet (STAFF_INVITE_EMAIL.en.reviewedBy)');
  }
  const { copy } = STAFF_INVITE_EMAIL[locale];
  const inviter = input.inviterFirstName?.trim() || copy.someone;
  return layout({
    locale,
    copy,
    body: copy.body[input.role].replace('{inviter}', inviter),
    link: input.link,
    appUrl: input.appUrl,
  });
}
