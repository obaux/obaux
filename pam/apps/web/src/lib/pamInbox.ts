/**
 * The Pam team's inbox (card a100, D-605): who wrote to Pam, grouped the way the super admin works through them.
 *
 * Pure: the rows come from `pam_inbox()` (Nico's, Pam team only) and this file only sorts and words them, so the order
 * and the "Waiting 3 hours" line are tested without a browser. A row carries only what that function returns: a first
 * name, a role, a region, a lead's program, and the last message's first line. No last name, phone, email or city.
 */

export type PamAskerRole = 'member' | 'admin' | 'provider';

export interface PamInboxRow {
  readonly conversationId: string;
  readonly firstName: string;
  readonly role: PamAskerRole;
  readonly region: string | null;
  /** For a program lead: the program they lead. */
  readonly programName: string | null;
  readonly lastMessageAt: string;
  /** Pam wrote the last message (a person on the team; the automatic out-of-hours reply never counts). */
  readonly lastFromTeam: boolean;
  /** When the person's oldest message since Pam last replied was sent; null when nothing waits. */
  readonly waitingSince: string | null;
  readonly status: 'open' | 'closed';
  readonly lastLine: string;
}

export interface PamInboxGroups {
  /** Longest waiting first: for this audience, silence is what loses people (Iris). */
  readonly waiting: readonly PamInboxRow[];
  /** Open, and Pam wrote last: newest first. */
  readonly answered: readonly PamInboxRow[];
  /** Folded under one row at the foot: newest first. */
  readonly closed: readonly PamInboxRow[];
}

const newestFirst = (a: PamInboxRow, b: PamInboxRow) => b.lastMessageAt.localeCompare(a.lastMessageAt);

/** A closed conversation is closed whatever its last message; an open one waits until someone on the team writes. */
export function groupPamInbox(rows: readonly PamInboxRow[]): PamInboxGroups {
  const open = rows.filter((row) => row.status === 'open');
  return {
    waiting: open
      .filter((row) => row.waitingSince !== null)
      .sort((a, b) => (a.waitingSince ?? '').localeCompare(b.waitingSince ?? '') || newestFirst(a, b)),
    answered: open.filter((row) => row.waitingSince === null).sort(newestFirst),
    closed: rows.filter((row) => row.status === 'closed').sort(newestFirst),
  };
}

/** The Home row's number (a plain count, D-586): conversations waiting for a reply. */
export const pamWaitingCount = (rows: readonly PamInboxRow[]): number => groupPamInbox(rows).waiting.length;

/**
 * How long someone has waited, as the one unit a person would say: minutes under an hour, hours under a day, then
 * days. Never "0 minutes": a message from just now has waited one.
 */
export function waitedFor(since: string, now: Date = new Date()): { readonly unit: 'minutes' | 'hours' | 'days'; readonly count: number } {
  const minutes = Math.max(1, Math.floor((now.getTime() - new Date(since).getTime()) / 60_000));
  if (minutes < 60) return { unit: 'minutes', count: minutes };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { unit: 'hours', count: hours };
  return { unit: 'days', count: Math.floor(hours / 24) };
}

/** The reply-time line's duration (a median in seconds), in the same units as the waiting line. */
export function replyDuration(seconds: number): { readonly unit: 'minutes' | 'hours' | 'days'; readonly count: number } {
  return waitedFor(new Date(0).toISOString(), new Date(Math.max(60, seconds) * 1000));
}
