'use client';

/**
 * Signing up, from the browser's side.
 *
 * Every write here goes through a database function, and none of them takes a
 * role as an argument. That is deliberate and it is the lesson of 0046: the
 * profiles table used to accept `role` from anybody who could update their own
 * row, so a person who could receive a text message could make themselves the
 * account that sees every account in PAM. `start_membership` creates a member
 * because "member" is a literal inside it, and there is no parameter to pass
 * anything else to.
 *
 * The two staff answers do not create anything. Somebody who says they run a
 * program, or that they carry a caseload, is claiming the ability to see other
 * people's information, and a radio button is not a credential — so it writes a
 * request and a human at PAM checks it and sends an invite.
 */

/** What somebody picked on the "which one fits you" question. */
export type JoinKind = 'member' | 'provider' | 'admin';

export type JoinOutcome =
  | { result: 'member' }
  /** PAM does not serve the city they typed. */
  | { result: 'city-not-served' }
  /** A staff claim was recorded; somebody will call them. */
  | { result: 'staff' }
  | { result: 'failed' };

export interface JoinDetails {
  readonly firstName: string;
  readonly lastName: string;
  readonly city: string;
  readonly kind: JoinKind;
  readonly language: string;
}

/**
 * Postgres raises P0002 when the city is not one PAM is in.
 *
 * PostgREST hands the code back on the error rather than the message, which is
 * what makes this safe to branch on: the message is somebody's copy and will be
 * rewritten, the code is the contract.
 */
function isCityNotServed(error: unknown): boolean {
  return Boolean(error) && (error as { code?: string }).code === 'P0002';
}

export async function submitDetails(details: JoinDetails): Promise<JoinOutcome> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();

    if (details.kind === 'member') {
      const { error } = await supabase.rpc('start_membership', {
        p_first_name: details.firstName.trim(),
        p_last_name: details.lastName.trim(),
        p_city: details.city.trim(),
        p_language: details.language,
      });
      if (!error) return { result: 'member' };
      return isCityNotServed(error) ? { result: 'city-not-served' } : { result: 'failed' };
    }

    const { error } = await supabase.rpc('request_staff_access', {
      p_wants_role: details.kind,
      p_first_name: details.firstName.trim(),
      p_last_name: details.lastName.trim(),
      p_city: details.city.trim(),
    });
    return error ? { result: 'failed' } : { result: 'staff' };
  } catch {
    return { result: 'failed' };
  }
}

/** Leave a name for a city PAM is not in yet. `wantsUpdates` is their choice. */
export async function joinWaitingCity(city: string, wantsUpdates: boolean): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('join_waiting_city', {
      p_city: city.trim(),
      p_wants_updates: wantsUpdates,
    });
    return !error;
  } catch {
    return false;
  }
}

/** The cities PAM is in, by name (0048). Empty when it cannot be asked. */
export async function servedCities(): Promise<string[]> {
  try {
    const { createClient } = await import('./supabase');
    const { data } = await createClient().rpc('served_cities');
    return Array.isArray(data) ? data.map((row: { city: string }) => row.city) : [];
  } catch {
    return [];
  }
}

/**
 * Marks setup finished, and records that the transparency screen was read.
 *
 * Writing `onboarded_at` is what earns the first 25 points — the trigger in
 * 0047 does the awarding, so the number the last screen shows is one the
 * database decided rather than one this file made up.
 *
 * `transparency_ack_at` is only written for members, because the member screen
 * is the one that makes a promise: it says what a case manager can and cannot
 * see, and the timestamp is the record that they saw the version that was true
 * that day. Staff read a different screen, which tells them what to expect
 * rather than promising them anything.
 */
export async function finishSetup(userId: string, ackTransparency: boolean): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const now = new Date().toISOString();
    const { error } = await createClient()
      .from('profiles')
      .update(
        ackTransparency
          ? { onboarded_at: now, transparency_ack_at: now }
          : { onboarded_at: now },
      )
      .eq('id', userId);
    return !error;
  } catch {
    return false;
  }
}
