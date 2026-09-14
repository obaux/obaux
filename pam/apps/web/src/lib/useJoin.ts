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

/** What went wrong with a code, in the database's own words (0008). */
export type InviteProblem =
  | 'invite_not_found'
  | 'invite_already_used'
  | 'invite_expired'
  | 'invite_phone_mismatch'
  | 'something_went_wrong';

export type RedeemOutcome =
  | { result: 'redeemed'; role: JoinKind | 'super_admin' }
  | { result: 'failed'; problem: InviteProblem };

/**
 * Turn a code somebody was given into the account it was made for.
 *
 * The invite carries the role and the region, chosen by the person who made
 * it — a case manager for members and programs, the person running PAM for a
 * case manager (0049). The screen sends the name and city alongside so an
 * invited person is not the one person PAM has no last name for.
 *
 * The four failure words are the function's own (`INVITE_NOT_FOUND` and so
 * on). They are mapped here, once, to the notice keys that already exist for
 * them — the screen shows the plain sentence and the distinction stays out of
 * it, which is what 0008 intended.
 */
export async function redeemInvite(
  code: string,
  details: Omit<JoinDetails, 'kind'>,
): Promise<RedeemOutcome> {
  try {
    const { createClient } = await import('./supabase');
    const { data, error } = await createClient().rpc('redeem_invite', {
      p_code: code.trim().toUpperCase(),
      p_first_name: details.firstName.trim(),
      p_preferred_language: details.language,
      p_last_name: details.lastName.trim(),
      p_home_city: details.city.trim(),
    });
    if (error) {
      const message = String((error as { message?: string }).message ?? '');
      const problem: InviteProblem = message.includes('INVITE_NOT_FOUND')
        ? 'invite_not_found'
        : message.includes('INVITE_ALREADY_USED')
          ? 'invite_already_used'
          : message.includes('INVITE_EXPIRED')
            ? 'invite_expired'
            : message.includes('INVITE_PHONE_MISMATCH')
              ? 'invite_phone_mismatch'
              : 'something_went_wrong';
      return { result: 'failed', problem };
    }
    const profile = (Array.isArray(data) ? data[0] : data) as { role?: string } | null;
    return { result: 'redeemed', role: (profile?.role ?? 'member') as JoinKind | 'super_admin' };
  } catch {
    return { result: 'failed', problem: 'something_went_wrong' };
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
