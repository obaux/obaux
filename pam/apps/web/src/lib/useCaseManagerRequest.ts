'use client';

/**
 * A case manager asking to use Pam, from the website (D-568). They sign in with the normal code first
 * (the code is the rate limit, and nothing is stored for a phone nobody proved), then send the few
 * facts the super admin needs to decide: name, city, organization and work email.
 *
 * It writes a staff request like any other (`request_case_manager_access`, migration
 * 20261013203725), so the super admin's bell, Requests and the approved and denied texts are the
 * ones every staff request already has. Nothing here makes a profile.
 */

export type StaffRequestDecision = 'waiting' | 'approved' | 'denied';

/** This sign-in's own request, if it has one (`staff_requests_own`: a person reads only theirs). */
export interface MyStaffRequest {
  readonly wantsRole: 'admin' | 'provider';
  readonly decision: StaffRequestDecision;
  readonly firstName: string;
  readonly lastName: string;
  readonly city: string;
  readonly organization: string;
}

/** How long Join waits to learn whether this sign-in asked to be a case manager. */
const ANSWER_WITHIN_MS = 3000;

export async function myStaffRequest(): Promise<MyStaffRequest | null> {
  try {
    const { createClient } = await import('./supabase');
    const supabase = createClient();
    // The id from the session this browser holds: no round trip before the one that matters.
    const { data: held } = await supabase.auth.getSession();
    const id = held.session?.user.id;
    if (!id) return null;
    // Join waits on this answer, so it is given a limit: no answer reads as no request.
    const { data, error } = await supabase
      .from('staff_requests')
      .select('wants_role, decision, first_name, last_name, city, organization')
      .eq('user_id', id)
      .abortSignal(AbortSignal.timeout(ANSWER_WITHIN_MS))
      .maybeSingle();
    if (error || !data) return null;
    const r = data as {
      wants_role: 'admin' | 'provider';
      decision: 'approved' | 'denied' | null;
      first_name: string | null;
      last_name: string | null;
      city: string | null;
      organization?: string | null;
    };
    return {
      wantsRole: r.wants_role,
      decision: r.decision ?? 'waiting',
      firstName: r.first_name ?? '',
      lastName: r.last_name ?? '',
      city: r.city ?? '',
      organization: r.organization ?? '',
    };
  } catch {
    return null;
  }
}

export interface CaseManagerAsk {
  readonly firstName: string;
  readonly lastName: string;
  readonly city: string;
  readonly organization: string;
  readonly workEmail: string;
  readonly language: string;
}

export type CaseManagerAskFailure = 'invalid' | 'waiting' | 'approved' | 'hasAccount' | 'other';

export async function requestCaseManagerAccess(
  ask: CaseManagerAsk,
): Promise<{ ok: true } | { ok: false; reason: CaseManagerAskFailure }> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('request_case_manager_access', {
      p_first_name: ask.firstName.trim(),
      p_last_name: ask.lastName.trim(),
      p_city: ask.city.trim(),
      p_organization: ask.organization.trim(),
      p_work_email: ask.workEmail.trim(),
      p_language: ask.language,
    });
    if (!error) return { ok: true };
    const m = error.message ?? '';
    if (m.includes('INVALID')) return { ok: false, reason: 'invalid' };
    if (m.includes('REQUEST_ALREADY_WAITING')) return { ok: false, reason: 'waiting' };
    if (m.includes('REQUEST_ALREADY_APPROVED')) return { ok: false, reason: 'approved' };
    if (m.includes('HAS_ACCOUNT')) return { ok: false, reason: 'hasAccount' };
    return { ok: false, reason: 'other' };
  } catch {
    return { ok: false, reason: 'other' };
  }
}

/** Loosely an email: something, an @, something with a dot. The database checks the same. */
export const looksLikeEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
