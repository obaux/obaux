import { asksForSavedTrips, isSavedPlace } from './savedTrips';
import type { SessionState } from './useSession';

/**
 * A member tapped Call on a place (docs/points-awarding.md, rule 3). The row is
 * a plain `tel:` link, so Pam cannot know the call connected; the database
 * (`log_call`, 20261010122206) pays 10 points the first time for a place, five
 * places a day, and ignores anyone who is not a member.
 *
 * Fire and forget: the dialler opens at once and nothing here can slow it or
 * show an error. Only a real member on a real place asks; a demo account or an
 * example place is never sent.
 */
export function logCall(session: SessionState, placeId: string): void {
  if (asksForSavedTrips(session) === null || !isSavedPlace(placeId)) return;
  void (async () => {
    try {
      const { createClient } = await import('./supabase');
      await createClient().rpc('log_call', { p_service_id: placeId, p_timezone: zoneOrDefault() });
    } catch {
      // Points are a courtesy; the call itself already went ahead.
    }
  })();
}

function zoneOrDefault(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
  } catch {
    return 'America/New_York';
  }
}
