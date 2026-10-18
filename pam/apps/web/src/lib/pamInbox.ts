/**
 * The Pam team's inbox (card a100, D-605), the parts Nico's `lib/pam.ts` leaves to the screen: which conversations it
 * lists, and the "Waiting 3 hours" and reply-time words. Pure, so they are tested without a browser.
 */
import { groupInbox, type PamInboxRow } from './pam';

/**
 * Every account gets a Pam conversation with Pam's welcome (D-605), so `pam_inbox()` returns one for nearly everybody.
 * The inbox lists only the ones somebody has written in (a person or the team): a welcome on its own is not a
 * conversation to answer.
 */
export const writtenIn = (rows: readonly PamInboxRow[]): readonly PamInboxRow[] => rows.filter((row) => row.preview !== null);

/** The inbox's three groups, from the conversations somebody has written in (`groupInbox` sorts them, Nico's). */
export const inboxGroups = (rows: readonly PamInboxRow[]) => groupInbox(writtenIn(rows));

/** The Home row's number (a plain count, D-586): conversations waiting for a reply. */
export const pamWaitingCount = (rows: readonly PamInboxRow[]): number => inboxGroups(rows).waiting.length;

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
