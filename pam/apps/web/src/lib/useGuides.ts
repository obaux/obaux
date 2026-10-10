'use client';

import { useEffect, useState } from 'react';
import { DUMMY_CASE_MANAGERS, DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useCaseload } from './useCaseload';

/**
 * A member's guide, and limiting or pausing them (D-446).
 *
 * Every write here is one database function that checks its caller itself
 * (`assign_guide`, `hand_over_member`, `admin_set_access_status`): a check in
 * the browser is a suggestion, the same call from a console would answer
 * anybody. Case managers no longer write `admin_assignments` at all.
 */

export type AccessStatus = 'active' | 'limited' | 'suspended';

export interface GuideChoice {
  readonly id: string;
  readonly firstName: string | null;
  readonly regionName: string | null;
}

/** True when the id belongs to the example cast: nothing is written for them. */
export function isExampleId(id: string): boolean {
  return DUMMY_EVERYONE.some((p) => p.id === id);
}

async function call(fn: string, args: Record<string, unknown>): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc(fn, args);
    return !error;
  } catch {
    return false;
  }
}

/** Limit, pause or turn back on. A reason is required, and only staff read it. */
export function setAccessStatus(memberId: string, status: AccessStatus, reason: string): Promise<boolean> {
  return call('admin_set_access_status', { p_subject_id: memberId, p_status: status, p_reason: reason.trim() });
}

/** A case manager gives one of their members to a colleague in their city. */
export function handOver(memberId: string, toId: string): Promise<boolean> {
  return call('hand_over_member', { p_member: memberId, p_to: toId });
}

/** The super admin sets a member's guide; `null` leaves them with none. */
export function assignGuide(memberId: string, guideId: string | null): Promise<boolean> {
  return call('assign_guide', { p_member: memberId, p_guide: guideId });
}

export type ChoicesState =
  | { status: 'loading' }
  | { status: 'ready'; guides: readonly GuideChoice[] }
  | { status: 'error' };

/**
 * Who a picker lists: for a case manager, the other case managers in their
 * city; for the super admin, every case manager and themselves. The database
 * decides (`guides_i_can_choose`). An example page lists the example cast.
 */
export function useGuideChoices(enabled: boolean, isExample: boolean): ChoicesState {
  const [state, setState] = useState<ChoicesState>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    if (isExample) {
      setState({
        status: 'ready',
        guides: DUMMY_CASE_MANAGERS.map((p) => ({ id: p.id, firstName: p.firstName, regionName: p.regionName })),
      });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('guides_i_can_choose');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error' });
          return;
        }
        const rows = (data ?? []) as { id: string; first_name: string | null; region_name: string | null }[];
        setState({
          status: 'ready',
          guides: rows.map((r) => ({ id: r.id, firstName: r.first_name, regionName: r.region_name })),
        });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, isExample]);

  return state;
}

/**
 * Each member's guide, for the super admin's Everyone (`directory_guides`).
 * A member who is not in the map has no guide. Empty for anyone else.
 */
export function useDirectoryGuides(
  enabled: boolean,
  nonce = 0,
): ReadonlyMap<string, { readonly guideId: string; readonly guideFirstName: string | null }> | null {
  const [guides, setGuides] = useState<ReadonlyMap<
    string,
    { readonly guideId: string; readonly guideFirstName: string | null }
  > | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('directory_guides');
        if (cancelled || error) return;
        const rows = (data ?? []) as { member_id: string; guide_id: string; guide_first_name: string | null }[];
        setGuides(new Map(rows.map((r) => [r.member_id, { guideId: r.guide_id, guideFirstName: r.guide_first_name }])));
      } catch {
        // Without it the list still shows; it just cannot say who guides whom.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  return guides;
}

/**
 * A member a case manager may act on: someone from the example cast, or
 * someone on their own caseload. Nothing about a real member is fetched that
 * the caseload does not already show (§4.1).
 */
export function useCaseloadPerson(id: string): {
  readonly loading: boolean;
  readonly person: { readonly firstName: string; readonly accessStatus: AccessStatus; readonly isExample: boolean } | null;
} {
  const example = DUMMY_EVERYONE.find((p) => p.id === id && p.role === 'member');
  const { state: caseload } = useCaseload(!example);
  if (example) {
    return { loading: false, person: { firstName: example.firstName, accessStatus: example.accessStatus, isExample: true } };
  }
  if (caseload.status === 'loading') return { loading: true, person: null };
  const member = caseload.status === 'ready' ? caseload.members.find((m) => m.id === id) : undefined;
  return {
    loading: false,
    person: member ? { firstName: member.firstName ?? '—', accessStatus: member.accessStatus, isExample: false } : null,
  };
}
