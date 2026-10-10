/**
 * SMS templates — SOP §9.
 *
 * Assume every phone is shared or visible to someone else. A message that
 * reveals justice involvement can cost a member their housing or their job.
 * These rules are enforced here, in code, not left to the caller:
 *
 *  - never name justice terms, programs that imply justice involvement,
 *    other users' full names, or health/legal detail
 *  - "Pam:" prefix, one clear action, <= 160 characters, no emoji
 *  - STOP instruction on the first message to a number, and monthly after
 *  - every template carries `reviewedBy`; an unreviewed template cannot send
 */

import type { Locale } from './i18n.js';
import { smsTermHits } from './sms-terms.js';

export type SmsTemplateKey =
  | 'invite_member'
  | 'invite_provider'
  | 'verify_code'
  | 'facilitation_member'
  | 'facilitation_provider'
  | 'appointment_24h'
  | 'appointment_2h'
  | 'appointment_morning_of'
  | 'attendance_check'
  | 'attendance_missed_followup'
  | 'connection_request'
  | 'access_limited_notice'
  | 'saved_place_closed'
  | 'staff_request_approved'
  | 'staff_request_denied';

/** The languages whose texts are signed off one by one; English and Spanish are signed with the template. */
export type MoreLocale = Exclude<Locale, 'en' | 'es'>;

export interface SmsDraft {
  readonly body: string;
  /**
   * Who read this wording, in this language, against §9. Empty means nobody has:
   * the text is a draft and will not send. **Only a person fills this in** —
   * never an agent on its own authority, the same rule as `reviewedBy` below.
   */
  readonly reviewedBy: string;
  /** Tighter than the template's budgets, for a language that has less room. */
  readonly maxVarLengths?: Readonly<Record<string, number>>;
}

export interface SmsTemplate {
  readonly key: SmsTemplateKey;
  /**
   * Template body. `{placeholders}` are filled by `renderSms`.
   * Written in plain language at a 5th-grade reading level.
   */
  readonly en: string;
  readonly es: string;
  /**
   * The same message in the languages added on 9 October 2026 (A24), each with
   * its own sign-off. **A draft with an empty `reviewedBy` is never used**: the
   * dispatcher texts that person in English instead, because a text is the one
   * place Pam cannot show somebody a draft first. (Will approved all of them on 9
   * October 2026 to learn from — `APPROVED_TO_LEARN_FROM`.) A template with no entry for
   * a language is one that does not fit a single message in it (see
   * `SMS_MAX_LENGTH_UCS2`) — that language gets English for it, on purpose.
   */
  readonly more?: Readonly<Partial<Record<MoreLocale, SmsDraft>>>;
  /**
   * How many segments this template may take in a script the cheap encoding
   * cannot carry. Absent means one (70 characters). Only the appointment
   * reminders have two (D-431): in English, Spanish and Portuguese they stay one.
   */
  readonly ucs2Segments?: 1 | 2;
  /** Named placeholders this template expects. Render fails if any is missing. */
  readonly vars: readonly string[];
  /**
   * Who signed off on the copy against §9. An empty string means NOT reviewed,
   * and `renderSms` will refuse to render it. Do not fill this in for your own
   * draft — it is a human sign-off field.
   */
  readonly reviewedBy: string;
  /** True when this is the first message Pam sends a number — forces STOP text. */
  readonly isFirstContact: boolean;
  /**
   * Per-variable length budget. A value longer than its budget is shortened at
   * a word boundary rather than pushing the body over 160 characters.
   *
   * This exists because a reminder that throws is a reminder that never sends.
   * A member missing their appointment because their street address was long is
   * a far worse outcome than a slightly clipped address next to a maps link.
   */
  readonly maxVarLengths?: Readonly<Record<string, number>>;
}

export {
  FORBIDDEN_SMS_TERMS,
  FORBIDDEN_SMS_TERMS_BY_LOCALE,
  smsTermHits,
  foldedSmsTermsByLocale,
} from './sms-terms.js';

export const SMS_MAX_LENGTH = 160;

/**
 * A text in a script GSM-7 cannot carry (Chinese, Russian, Arabic) is sent as
 * UCS-2, and one segment of that holds 70 characters, not 160. Pam told the
 * carrier that every message fits one segment, so these texts are held to 70 —
 * and a template that cannot be said in 70 characters in a language, with a
 * 36-character link and a time, has no text in it and falls back to English.
 *
 * One exception, by Will's word (9 October 2026, D-431): the three appointment
 * reminders carry a time, an address and a link, and may take **two** segments
 * in these scripts (`ucs2Segments: 2` on the template). A message of two or more
 * UCS-2 segments is joined by the phone, and each part holds 67 characters (the
 * rest of each is the joining header), so two segments are 134 characters.
 * Everything else stays at one.
 */
export const SMS_MAX_LENGTH_UCS2 = 70;

/** One part of a joined UCS-2 message: 3 fewer than a lone segment, which carries no header. */
export const SMS_MAX_LENGTH_UCS2_PART = 67;

/** What a template allowed two segments in the wide encoding holds: 2 × 67. */
export const SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS = 2 * SMS_MAX_LENGTH_UCS2_PART;

/**
 * Longest link a text carries: the live `app_url` setting, which the staff
 * request texts use as they are. Twilio shortens the others to about 22
 * characters, so this is the worst case for a script that has only 70.
 */
export const SMS_WORST_CASE_LINK_LENGTH = 36;

/**
 * The limit a text is held to: 160 for the cheap encoding, 70 for the other —
 * or, for a template that is allowed two segments in the other (`ucs2Segments`),
 * 134. The cheap encoding is never given more than one segment.
 */
export function segmentLimitFor(templateText: string, ucs2Segments: 1 | 2 = 1): number {
  if (isGsm7(templateText.replace(/\{[a-zA-Z0-9_]+\}/g, ''))) return SMS_MAX_LENGTH;
  return ucs2Segments === 1 ? SMS_MAX_LENGTH_UCS2 : SMS_MAX_LENGTH_UCS2_TWO_SEGMENTS;
}

/**
 * Why a place came out of the catalogue, in the words a member reads.
 *
 * These live here rather than in the locale bundles because they end up inside
 * a text message, which means they are subject to every §9 rule and belong in
 * the same review pass as the templates themselves. The dispatcher looks up the
 * phrase by key in the member's own language; the queue carries the key, never
 * the phrase, so a correction here reaches messages that are already waiting.
 *
 * Spanish uses verb phrases rather than adjectives on purpose: "cerrado" has to
 * agree with the gender of a noun the database does not know.
 */
export const SERVICE_FLAG_REASONS = {
  closed: {
    en: 'closed, so there is no need to go',
    es: 'ya no abre, no hace falta ir',
    'pt-BR': 'fechou, nao precisa ir',
    'zh-CN': '已关闭，无需前往',
    'zh-HK': '已結業，無需前往',
  },
  moved: {
    en: 'at a new address now',
    es: 'cambio de direccion',
    'pt-BR': 'mudou de endereco',
    'zh-CN': '已搬到新地址',
    'zh-HK': '已搬到新地址',
  },
  not_accepting: {
    en: 'not taking new people, so there is no need to go',
    es: 'no acepta gente nueva, no hace falta ir',
    'pt-BR': 'nao aceita gente nova, nao precisa ir',
    'zh-CN': '暂不接收新人，无需前往',
    'zh-HK': '暫不接收新人，無需前往',
  },
  wrong_info: {
    en: 'listed wrong here',
    es: 'esta mal anotado aqui',
    'pt-BR': 'esta com informacao errada aqui',
    'zh-CN': '这里的信息有误',
    'zh-HK': '這裡的資料有誤',
  },
} as const;

export type ServiceFlagReason = keyof typeof SERVICE_FLAG_REASONS;

export const SERVICE_FLAG_REASON_KEYS = Object.keys(
  SERVICE_FLAG_REASONS,
) as ServiceFlagReason[];

/**
 * The way out, in each language. STOP stays STOP in all of them — it is the
 * keyword the carrier and the reply parser listen for — with the sentence
 * around it in the reader's language. Spanish is the wording registered with
 * the carrier (docs/sms-campaign-samples.md); the dispatcher reads this same
 * table, so the two can no longer say different things.
 */
export const STOP_SUFFIX: Readonly<Record<Locale, string>> = {
  en: ' Reply STOP to stop texts.',
  es: ' Responda STOP para no recibir mas.',
  'pt-BR': ' Responda STOP para nao receber mais.',
  'zh-CN': ' 回复 STOP 退订。',
  'zh-HK': ' 回覆 STOP 取消接收。',
  ru: ' Ответьте STOP для отписки.',
  ar: ' للإلغاء أرسل STOP.',
};

/**
 * Will's approval of the drafts in the five later languages (Portuguese, both
 * Chinese, Russian, Arabic), 9 October 2026: "Let's approve new languages for
 * now. We'll take a fail first then fix it approach. We'll adjust languages based
 * on feedback."
 *
 * It is worded for what it is. These were drafted by a model and **no native
 * speaker has read them**; they are approved to learn from, and are changed when
 * somebody who reads the language says they are wrong. A fix that brings a draft
 * closer to the English meaning keeps this approval; anything that says more or
 * something new goes back to Will. Emptying it for a language puts that language
 * back to English at the next deploy. **An agent never writes this on its own
 * authority** — this one is Will's, given in so many words.
 */
export const APPROVED_TO_LEARN_FROM =
  'Will (Oba), 9 October 2026 — approved to learn from; no native reader yet';

/** A wording in one of the later languages, carrying Will's approval above. */
const approved = (body: string, maxVarLengths?: Readonly<Record<string, number>>): SmsDraft =>
  maxVarLengths
    ? { body, reviewedBy: APPROVED_TO_LEARN_FROM, maxVarLengths }
    : { body, reviewedBy: APPROVED_TO_LEARN_FROM };

/**
 * Who read this copy and signed it off.
 *
 * Every template shipped with this empty, and `renderSms` threw on an
 * unreviewed one, so Pam could not text anybody until a person had read the
 * words. Will read all thirteen and approved them on 13 September 2026, and
 * this is that record.
 *
 * It is not decoration. Emptying it stops every message again, which is the
 * correct behaviour for copy nobody has read — so **a new template starts empty
 * and stays empty until a human says otherwise**, and rewording an existing one
 * means asking again. An agent must never fill this in on its own authority.
 */
const REVIEWED_BY = 'Will (Oba), 13 September 2026';

/** The catalogue. */
export const SMS_TEMPLATES: Readonly<Record<SmsTemplateKey, SmsTemplate>> = {
  invite_member: {
    key: 'invite_member',
    en: "Pam: You've been invited to Pam, an app for finding help and people near you. Tap to join: {link}",
    es: 'Pam: Le invitaron a Pam, una app para encontrar ayuda y personas cerca. Toque para entrar: {link}',
    more: {
      'pt-BR': approved('Pam: Convidaram voce para o Pam, um app para achar ajuda e pessoas por perto. Toque para entrar: {link}'),
      'zh-CN': approved('Pam: 您受邀加入 Pam：{link}'),
      'zh-HK': approved('Pam: 你獲邀加入 Pam：{link}'),
    },
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: true,
  },
  invite_provider: {
    key: 'invite_provider',
    en: 'Pam: You have been invited to list your services on Pam. Tap to set up your page: {link}',
    es: 'Pam: Le invitaron a publicar sus servicios en Pam. Toque para crear su pagina: {link}',
    more: {
      'pt-BR': approved('Pam: Voce recebeu um convite para anunciar seus servicos no Pam. Toque para criar sua pagina: {link}'),
      'zh-CN': approved('Pam: 邀请您发布服务：{link}'),
      'zh-HK': approved('Pam: 邀請你發佈服務：{link}'),
    },
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: true,
  },
  verify_code: {
    key: 'verify_code',
    en: 'Pam: Your code is {code}. It works for 10 minutes.',
    es: 'Pam: Su codigo es {code}. Sirve por 10 minutos.',
    more: {
      'pt-BR': approved('Pam: Seu codigo é {code}. Vale por 10 minutos.'),
      'zh-CN': approved('Pam: 您的验证码是 {code}，10 分钟内有效。'),
      'zh-HK': approved('Pam: 你的驗證碼是 {code}，10 分鐘內有效。'),
      'ru': approved('Pam: Ваш код {code}. Действует 10 минут.'),
      'ar': approved('Pam: رمزك {code}. صالح لمدة 10 دقائق.'),
    },
    vars: ['code'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * §9: admin-originated SMS never says parole/probation/officer/case manager.
   * The admin's FIRST NAME only — never a title, never a full name.
   *
   * Reviewed with Will (D-062): the name stays. A text from a stranger about a
   * programme reads like spam, and a member who cannot tell whether to trust it
   * does not tap. Whatever fills `adminFirstName` must pass a first name and
   * nothing else — a surname or a title here would defeat the whole rule.
   */
  facilitation_member: {
    key: 'facilitation_member',
    en: 'Pam: {adminFirstName} connected you with a program that can help. Open Pam to say hi: {link}',
    es: 'Pam: {adminFirstName} le conecto con un programa que puede ayudar. Abra Pam para saludar: {link}',
    more: {
      'pt-BR': approved('Pam: {adminFirstName} conectou voce a um programa que pode ajudar. Abra o Pam para dizer oi: {link}'),
      'zh-CN': approved('Pam: {adminFirstName} 帮您联系了项目：{link}', { adminFirstName: 14 }),
      'zh-HK': approved('Pam: {adminFirstName} 幫你聯絡了計劃：{link}', { adminFirstName: 14 }),
    },
    vars: ['adminFirstName', 'link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  facilitation_provider: {
    key: 'facilitation_provider',
    en: 'Pam: Someone was introduced to your program. Open Pam to reply: {link}',
    es: 'Pam: Alguien fue presentado a su programa. Abra Pam para responder: {link}',
    more: {
      'pt-BR': approved('Pam: Alguem foi apresentado ao seu programa. Abra o Pam para responder: {link}'),
      'zh-CN': approved('Pam: 有人被介绍到您的项目。打开 Pam 回复：{link}'),
      'zh-HK': approved('Pam: 有人獲介紹到你的計劃。打開 Pam 回覆：{link}'),
    },
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * The Spanish copy is written without accents so it stays inside GSM-7, the
   * cheap SMS encoding: one accented character outside that set switches the
   * whole message to UCS-2 and halves the limit from 160 to 70, splitting one
   * message into two.
   *
   * `ñ` is the exception — it IS in the GSM-7 basic set, so it costs nothing,
   * and "manana" without it is not a word. Reviewed with Will: keep the English
   * YES/NO the reply parser listens for, keep the rest accent-free, take the
   * free fix.
   */
  appointment_24h: {
    key: 'appointment_24h',
    en: 'Pam: You have a visit tomorrow at {time}. {address}. Tap for directions: {link}',
    es: 'Pam: Tiene una visita mañana a las {time}. {address}. Toque para llegar: {link}',
    more: {
      'pt-BR': approved('Pam: Voce tem uma visita amanha as {time}. {address}. Toque para chegar: {link}'),
      'zh-CN': approved('Pam: 您明天{time}有预约。{address}。点按查看路线：{link}'),
      'zh-HK': approved('Pam: 你明天{time}有一次到訪。{address}。點按查看路線：{link}'),
      'ru': approved('Pam: Завтра в {time} у вас визит. {address}. Маршрут: {link}'),
      'ar': approved('Pam: لديك زيارة غدا في {time}. {address}. الاتجاهات: {link}'),
    },
    ucs2Segments: 2,
    vars: ['time', 'address', 'link'],
    maxVarLengths: { address: 34 },
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  appointment_2h: {
    key: 'appointment_2h',
    en: 'Pam: Your visit is at {time} today. {address}. Tap for directions: {link}',
    es: 'Pam: Su visita es hoy a las {time}. {address}. Toque para llegar: {link}',
    more: {
      'pt-BR': approved('Pam: Sua visita é hoje as {time}. {address}. Toque para chegar: {link}'),
      'zh-CN': approved('Pam: 您今天{time}有预约。{address}。点按查看路线：{link}'),
      'zh-HK': approved('Pam: 你今天{time}有一次到訪。{address}。點按查看路線：{link}'),
      'ru': approved('Pam: Ваш визит сегодня в {time}. {address}. Маршрут: {link}'),
      'ar': approved('Pam: زيارتك اليوم في {time}. {address}. الاتجاهات: {link}'),
    },
    ucs2Segments: 2,
    vars: ['time', 'address', 'link'],
    maxVarLengths: { address: 34 },
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  appointment_morning_of: {
    key: 'appointment_morning_of',
    en: 'Pam: Today at {time} you have a visit. {address}. Tap for directions: {link}',
    es: 'Pam: Hoy a las {time} tiene una visita. {address}. Toque para llegar: {link}',
    more: {
      'pt-BR': approved('Pam: Hoje as {time} voce tem uma visita. {address}. Toque para chegar: {link}'),
      'zh-CN': approved('Pam: 今天{time}您有预约。{address}。点按查看路线：{link}'),
      'zh-HK': approved('Pam: 今天{time}你有一次到訪。{address}。點按查看路線：{link}'),
      'ru': approved('Pam: Сегодня в {time} у вас визит. {address}. Маршрут: {link}'),
      'ar': approved('Pam: اليوم في {time} لديك زيارة. {address}. الاتجاهات: {link}'),
    },
    ucs2Segments: 2,
    vars: ['time', 'address', 'link'],
    maxVarLengths: { address: 34 },
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  attendance_check: {
    key: 'attendance_check',
    en: 'Pam: Did you make it today? Reply YES or NO.',
    es: 'Pam: Pudo ir hoy? Responda YES o NO.',
    more: {
      'pt-BR': approved('Pam: Voce conseguiu ir hoje? Responda YES ou NO.'),
      'zh-CN': approved('Pam: 您今天到了吗？回复 YES 或 NO。'),
      'zh-HK': approved('Pam: 你今日到了嗎？回覆 YES 或 NO。'),
      'ru': approved('Pam: Вы сегодня дошли? Ответьте YES или NO.'),
      'ar': approved('Pam: هل وصلت اليوم؟ رد بـ YES أو NO.'),
    },
    vars: [],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /** §7.2: a missed visit is never penalised. Gentle, one action, no guilt. */
  attendance_missed_followup: {
    key: 'attendance_missed_followup',
    en: 'Pam: No problem. We saved a step to set up a new time. Open Pam when you are ready: {link}',
    es: 'Pam: No hay problema. Guardamos un paso para buscar otra fecha. Abra Pam cuando pueda: {link}',
    more: {
      'pt-BR': approved('Pam: Sem problema. Guardamos um passo para marcar outra data. Abra o Pam quando puder: {link}'),
      'zh-CN': approved('Pam: 没关系。打开 Pam 重新约时间：{link}'),
      'zh-HK': approved('Pam: 不要緊。打開 Pam 重新約時間：{link}'),
      'ru': approved('Pam: Не страшно. Новое время: {link}'),
      'ar': approved('Pam: لا بأس. موعد جديد: {link}'),
    },
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * A pending case-manager or program-lead request was approved (0054).
   *
   * **Names no role.** "case manager" is a `FORBIDDEN_SMS_TERMS` entry — this
   * message has to read the same for both roles anyway, so it says only that
   * the request was approved, matching how `facilitation_member` already
   * handles "admin" as a first name with no title.
   */
  staff_request_approved: {
    key: 'staff_request_approved',
    en: 'Pam: Your request was approved. Open Pam to get started: {link}',
    es: 'Pam: Su solicitud fue aprobada. Abra Pam para empezar: {link}',
    more: {
      'pt-BR': approved('Pam: Seu pedido foi aprovado. Abra o Pam para comecar: {link}'),
      'zh-CN': approved('Pam: 您的申请已获批准。打开 Pam 开始：{link}'),
      'zh-HK': approved('Pam: 你的申請已獲批准。打開 Pam 開始：{link}'),
      'ru': approved('Pam: Заявка одобрена: {link}'),
      'ar': approved('Pam: تمت الموافقة على طلبك: {link}'),
    },
    vars: ['link'],
    reviewedBy: 'Will (Oba), 17 September 2026',
    isFirstContact: false,
  },
  /**
   * A pending case-manager or program-lead request was denied (0055).
   *
   * **Sent with no `member_id` at all** — a denial creates no profile, so
   * this is the one template in the catalogue queued straight to a phone
   * number, skipping the quiet-hours/STOP check every other message goes
   * through (Will, 17 September — deliberate, see `0055_staff_denied_sms.sql`
   * and DECISIONS.md). Names no role, same reason as `staff_request_approved`.
   * Carries `{supportPhone}` because Will asked specifically that someone
   * denied has somewhere real to ask why.
   */
  staff_request_denied: {
    key: 'staff_request_denied',
    en: 'Pam: Your request was not approved. Questions? Call {supportPhone}.',
    es: 'Pam: Su solicitud no fue aprobada. Preguntas? Llame al {supportPhone}.',
    more: {
      'pt-BR': approved('Pam: Seu pedido nao foi aprovado. Duvidas? Ligue para {supportPhone}.'),
      'zh-CN': approved('Pam: 您的申请未获批准。有疑问请拨打 {supportPhone}。'),
      'zh-HK': approved('Pam: 你的申請未獲批准。如有疑問請致電 {supportPhone}。'),
      'ru': approved('Pam: Заявку не одобрили. Вопросы? Звоните {supportPhone}'),
      'ar': approved('Pam: لم تتم الموافقة على طلبك. للاستفسار: {supportPhone}'),
    },
    vars: ['supportPhone'],
    reviewedBy: 'Will (Oba), 17 September 2026',
    isFirstContact: false,
  },
  /** §6.2: no names in a connection-request SMS. */
  connection_request: {
    key: 'connection_request',
    en: 'Pam: Someone on Pam wants to connect. Open Pam to reply: {link}',
    es: 'Pam: Alguien en Pam quiere conectar. Abra Pam para responder: {link}',
    more: {
      'pt-BR': approved('Pam: Alguem no Pam quer se conectar. Abra o Pam para responder: {link}'),
      'zh-CN': approved('Pam: 有人想在 Pam 联系您。打开 Pam 回复：{link}'),
      'zh-HK': approved('Pam: 有人想在 Pam 與你聯絡。打開 Pam 回覆：{link}'),
      'ru': approved('Pam: С вами хотят связаться: {link}'),
      'ar': approved('Pam: شخص يريد التواصل: {link}'),
    },
    vars: ['link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  /**
   * A place somebody saved has been taken out of the catalogue.
   *
   * **It never names the place**, and that is Will's call rather than a
   * limitation. Naming it would add nothing a member needs — they saved it, and
   * the app will show them which one — while turning every message into a
   * disclosure problem: "Fairmount Behavioral Health is closed" on a lock
   * screen tells a roommate something the member never chose to tell them.
   * There was a second, nameless template for exactly those places; not naming
   * any of them deleted the branch and the risk with it.
   *
   * The wording says what is wrong and offers a way on. It never says the place
   * was "not useful": a flag means somebody reported it as gone, which is not a
   * review, and a verdict on an organisation does not belong in a member's
   * messages.
   *
   * Both bodies are short enough to carry the STOP line and stay under 160 even
   * with the longest reason — including the mismatched case the length test
   * measures, where an English reason lands in the Spanish body. That cannot
   * happen in practice, but a template with no headroom is one edit from
   * splitting every notice into two messages.
   */
  saved_place_closed: {
    key: 'saved_place_closed',
    en: 'Pam: A place you saved is {reason}. Find others in Pam: {link}',
    es: 'Pam: Un lugar que guardo {reason}. Vea otros en Pam: {link}',
    more: {
      'pt-BR': approved('Pam: Um lugar que voce salvou {reason}. Veja outros no Pam: {link}'),
      'zh-CN': approved('Pam: 您收藏的地点{reason}。看其他：{link}'),
      'zh-HK': approved('Pam: 你儲存的地點{reason}。看其他：{link}'),
    },
    vars: ['reason', 'link'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
  access_limited_notice: {
    key: 'access_limited_notice',
    en: 'Pam: Some parts of Pam are turned off for now. Call {supportPhone} with questions.',
    es: 'Pam: Algunas partes de Pam estan apagadas por ahora. Llame al {supportPhone} si tiene preguntas.',
    more: {
      'pt-BR': approved('Pam: Algumas partes do Pam estao desligadas por enquanto. Ligue para {supportPhone} se tiver duvidas.'),
      'zh-CN': approved('Pam: Pam 的部分功能暂时关闭。有疑问请拨打 {supportPhone}。'),
      'zh-HK': approved('Pam: Pam 部分功能暫時關閉。如有疑問請致電 {supportPhone}。'),
      'ru': approved('Pam: Часть функций Pam пока отключена. Звоните {supportPhone}'),
      'ar': approved('Pam: بعض ميزات Pam متوقفة الآن. اتصل بـ {supportPhone}'),
    },
    vars: ['supportPhone'],
    reviewedBy: REVIEWED_BY,
    isFirstContact: false,
  },
};

export class UnreviewedTemplateError extends Error {
  constructor(key: SmsTemplateKey, locale?: Locale) {
    super(
      `SMS template "${key}"${locale && locale !== 'en' ? ` in ${locale}` : ''} has no reviewedBy and cannot be sent. ` +
        'A human must review the copy against SOP §9 and record their name.',
    );
    this.name = 'UnreviewedTemplateError';
  }
}

export class SmsContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsContentError';
  }
}

export interface RenderSmsOptions {
  readonly key: SmsTemplateKey;
  readonly locale: Locale;
  readonly vars?: Readonly<Record<string, string>>;
  /** Force the STOP suffix — true for first contact and the monthly reminder. */
  readonly includeStop?: boolean;
  /**
   * Escape hatch for tests only. Skips the reviewedBy gate. Never set this in
   * application code; the dispatcher does not pass it.
   */
  readonly allowUnreviewed?: boolean;
}

/** The wording of `key` in `locale`, and the name that signed it — or nothing, if there is none. */
function wordingOf(
  template: SmsTemplate,
  locale: Locale,
): { body: string; reviewedBy: string; maxVarLengths?: Readonly<Record<string, number>> } | undefined {
  if (locale === 'en') return { body: template.en, reviewedBy: template.reviewedBy };
  if (locale === 'es') return { body: template.es, reviewedBy: template.reviewedBy };
  return template.more?.[locale];
}

/**
 * The language a text to this person is actually written in: the one they
 * chose when there is signed-off wording for it, English when there is not.
 *
 * Spanish is signed with the template. Every other language is signed one
 * template at a time, so a person who reads Pam in Russian gets the Russian
 * wording for the messages a reader has signed and English for the rest —
 * and never a draft. A text cannot be shown to somebody for a second opinion.
 */
export function usableSmsLocale(key: SmsTemplateKey, wanted: Locale): Locale {
  const wording = wordingOf(SMS_TEMPLATES[key], wanted);
  return wording && wording.reviewedBy ? wanted : 'en';
}

/** Every wording a person has not yet read, as `template (language)`: what is left to sign. */
export function unsignedSmsDrafts(): { key: SmsTemplateKey; locale: MoreLocale }[] {
  const left: { key: SmsTemplateKey; locale: MoreLocale }[] = [];
  for (const template of Object.values(SMS_TEMPLATES)) {
    for (const [locale, draft] of Object.entries(template.more ?? {})) {
      if (!draft.reviewedBy) left.push({ key: template.key, locale: locale as MoreLocale });
    }
  }
  return left;
}

/**
 * Renders a template to a sendable body, or throws.
 *
 * Throwing is the point: a reminder that fails loudly in the dispatcher is
 * recoverable, a text that outs someone to their roommate is not.
 */
export function renderSms(options: RenderSmsOptions): string {
  const { key, locale, vars = {}, includeStop, allowUnreviewed = false } = options;
  const template = SMS_TEMPLATES[key];
  const wording = wordingOf(template, locale);

  if (!wording) {
    throw new SmsContentError(`Template "${key}" has no text in ${locale}.`);
  }
  if (!wording.reviewedBy && !allowUnreviewed) {
    throw new UnreviewedTemplateError(key, locale);
  }

  let body = wording.body;

  for (const name of template.vars) {
    const value = vars[name];
    if (value === undefined || value === '') {
      throw new SmsContentError(`Template "${key}" is missing required variable "${name}".`);
    }
    const budget = wording.maxVarLengths?.[name] ?? template.maxVarLengths?.[name];
    const fitted = budget === undefined ? value : shortenToFit(value, budget);
    body = body.split(`{${name}}`).join(fitted);
  }

  const leftover = body.match(/\{[a-zA-Z0-9_]+\}/);
  if (leftover) {
    throw new SmsContentError(`Template "${key}" left an unfilled placeholder: ${leftover[0]}`);
  }

  const stop = includeStop ?? template.isFirstContact;
  if (stop) body += STOP_SUFFIX[locale];

  // The limit follows the template's own words, not what a member's address
  // happens to contain: a plain English reminder stays a 160-character message
  // even if a street name carries a curly apostrophe.
  const limit = segmentLimitFor(wording.body + (stop ? STOP_SUFFIX[locale] : ''), template.ucs2Segments);
  assertSmsIsSafe(body, key, locale, limit);
  return body;
}

/**
 * Shortens a value to `max` characters, preferring a word boundary.
 *
 * No ellipsis: the three characters are better spent on the address itself, and
 * a trailing "..." reads as an error to someone scanning a text quickly. The
 * maps link in the same message carries the exact destination anyway.
 */
export function shortenToFit(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  // Only fall back to a hard cut when the first word alone exceeds the budget.
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Emoji, pictographs and dingbats — §9 forbids all of them in SMS. */
/**
 * The characters GSM-7 can carry — the cheap SMS encoding.
 *
 * One character outside this set switches the whole message to UCS-2, which
 * halves the limit from 160 to 70 and splits one message into two. That is a
 * doubled bill on every reminder, and on a pilot budget it is the difference
 * between reminding everybody and reminding half of them.
 *
 * This is why the Spanish copy is written without accents. It is also why `ñ`
 * is allowed to stay: it is in this set, so "mañana" is spelled correctly at no
 * cost. Anything added to the Spanish copy has to pass this check.
 */
export const GSM7_ALPHABET =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà' +
  // The extension table. These cost two characters each rather than one, so
  // they are legal but not free.
  '^{}\\[~]|€';

const GSM7_CHARS = new Set(GSM7_ALPHABET.split(''));

/** Every character in `text` fits the cheap encoding. */
export function isGsm7(text: string): boolean {
  return [...text].every((c) => GSM7_CHARS.has(c));
}

/** The characters in `text` that would force the expensive encoding. */
export function nonGsm7Characters(text: string): string[] {
  return [...new Set([...text].filter((c) => !GSM7_CHARS.has(c)))];
}

const EMOJI_PATTERN =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F2FF}]/u;

/**
 * Final gate before a body reaches Twilio. Exported so the dispatcher can
 * re-check a body it assembled from any path, not just `renderSms`.
 *
 * `locale` picks the forbidden-term list to apply on top of the English one;
 * `limit` is the segment limit (`segmentLimitFor`), 160 unless the text is in a
 * script that needs the 70-character encoding.
 */
export function assertSmsIsSafe(
  body: string,
  key?: string,
  locale: Locale = 'en',
  limit: number = SMS_MAX_LENGTH,
): void {
  const where = key ? ` (template "${key}")` : '';

  if (!body.startsWith('Pam:')) {
    throw new SmsContentError(`SMS must start with the "Pam:" prefix${where}.`);
  }
  if (body.length > limit) {
    throw new SmsContentError(`SMS is ${body.length} characters, over the ${limit} limit${where}.`);
  }
  if (EMOJI_PATTERN.test(body)) {
    throw new SmsContentError(`SMS must not contain emoji${where}.`);
  }

  const [term] = smsTermHits(body, locale);
  if (term !== undefined) {
    throw new SmsContentError(
      `SMS contains the forbidden term "${term}"${where}. ` +
        'Outbound texts must never reveal justice involvement (SOP §9).',
    );
  }
}

/** True when every template has a recorded reviewer. CI asserts this before a release build. */
export function allTemplatesReviewed(): boolean {
  return Object.values(SMS_TEMPLATES).every((t) => t.reviewedBy.length > 0);
}

export function unreviewedTemplateKeys(): SmsTemplateKey[] {
  return Object.values(SMS_TEMPLATES)
    .filter((t) => !t.reviewedBy)
    .map((t) => t.key);
}
