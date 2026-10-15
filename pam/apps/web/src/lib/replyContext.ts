/**
 * What the super admin needs to answer a help request by text, besides the number (D-583).
 *
 * The help form's words and when they were sent are stored nowhere (D-521), so they cannot be looked up.
 * They ride in the link that opens Answer by text, in the part after `#`: that part never goes to a
 * server, so it is not in any request log; the screen reads it from the address and keeps nothing.
 * `/reply/?to=+12155550142#q=How do I find my program&at=2026-10-15T14:05:00Z`
 *
 * Nothing builds such a link today (answering by text is off, D-547): this is the screen's side of it,
 * ready for the day it is on, and for a super admin who pastes one. Read defensively: it is whatever was
 * in the address.
 */
export interface ReplyContext {
  /** What they wrote, as they wrote it (control characters out, at most the form's own limit). */
  readonly question: string | null;
  /** When they sent it, as an ISO time. */
  readonly askedAt: string | null;
}

export const QUESTION_LIMIT = 3000;

const CONTROL = new RegExp(
  `[${Array.from({ length: 32 }, (_, code) => (code === 9 || code === 10 || code === 13 ? '' : String.fromCharCode(code))).join('')}${String.fromCharCode(127, 0x2028, 0x2029)}]`,
  'g',
);

export function replyContextFrom(fragment: string): ReplyContext {
  const params = new URLSearchParams(fragment.replace(/^#/, ''));
  const raw = (params.get('q') ?? '').replace(CONTROL, '').trim();
  const question = raw === '' ? null : raw.slice(0, QUESTION_LIMIT);
  const at = params.get('at');
  const time = at ? Date.parse(at) : Number.NaN;
  return { question, askedAt: Number.isNaN(time) ? null : new Date(time).toISOString() };
}
