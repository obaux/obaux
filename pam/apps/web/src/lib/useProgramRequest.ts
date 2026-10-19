'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ProgramDetails } from './useJoin';
import { rpcWithLanguage } from './rpcLanguage';
import type { SessionState } from './useSession';

/**
 * A member's own request to add a program (D-525; Will, 11 October 2026: "anyone
 * should be able to create a program").
 *
 * The door is `request_staff_access` (it needs no invite and grants nothing); a
 * super admin approves it on the Requests screen, which gives the account the
 * provider role next to its member side and creates the program (D-491). This
 * reads where the member's request stands (`staff_requests_own`, readable by its
 * owner) and sends or re-sends it. A request still waiting is not sent twice, one
 * that was approved is not reopened, and one turned down can be asked again (the
 * database says which).
 */
export type ProgramRequestState =
  | { readonly status: 'loading' }
  | { readonly status: 'none' }
  | { readonly status: 'waiting'; readonly details: ProgramDetails }
  | { readonly status: 'denied'; readonly details: ProgramDetails }
  | { readonly status: 'approved' };

interface RequestRow {
  readonly wants_role: string;
  readonly decision: string | null;
  readonly program_name: string | null;
  readonly program_category: string | null;
  readonly program_subcategory: string | null;
  readonly program_description: string | null;
  readonly program_address: string | null;
  readonly program_phone: string | null;
  readonly program_website: string | null;
}

const COLUMNS =
  'wants_role, decision, program_name, program_category, program_subcategory, program_description, program_address, program_phone, program_website';

export function requestFromRow(row: RequestRow | null): ProgramRequestState {
  if (row === null || row.wants_role !== 'provider') return { status: 'none' };
  if (row.decision === 'approved') return { status: 'approved' };
  const details: ProgramDetails = {
    name: row.program_name ?? '',
    category: row.program_category ?? '',
    subcategory: row.program_subcategory ?? '',
    description: row.program_description ?? '',
    address: row.program_address ?? '',
    phone: row.program_phone ?? '',
    website: row.program_website ?? '',
    services: [],
  };
  return row.decision === 'denied' ? { status: 'denied', details } : { status: 'waiting', details };
}

export function useProgramRequest(session: SessionState): { state: ProgramRequestState; refresh: () => void } {
  const [state, setState] = useState<ProgramRequestState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  const userId = session.status === 'signed-in' ? session.session.userId : null;

  useEffect(() => {
    if (userId === null) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().from('staff_requests').select(COLUMNS).eq('user_id', userId).maybeSingle();
        if (cancelled) return;
        setState(error ? { status: 'none' } : requestFromRow((data ?? null) as RequestRow | null));
      } catch {
        if (!cancelled) setState({ status: 'none' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, nonce]);

  return { state, refresh };
}

export type AskResult = 'ok' | 'waiting' | 'approved' | 'failed';

/** Sends the request (or sends it again after a no). */
export async function askToAddProgram(
  details: ProgramDetails,
  who: { readonly firstName: string; readonly city: string; readonly language: string },
  /** Told why when the ask fails (a code for the error log; its words go no further), D-616. */
  onFailure?: (error: unknown) => void,
): Promise<AskResult> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await rpcWithLanguage(
      createClient(),
      'request_staff_access',
      {
        p_wants_role: 'provider',
        p_first_name: who.firstName,
        p_last_name: '',
        p_city: who.city,
        p_program_name: details.name.trim(),
        p_program_category: details.category,
        p_program_subcategory: details.subcategory,
        p_program_description: details.description.trim(),
        p_program_address: details.address.trim(),
        p_program_phone: details.phone.trim(),
        p_program_website: details.website.trim(),
      },
      who.language,
    );
    if (!error) return 'ok';
    const message = (error as { message?: string }).message ?? '';
    if (message.includes('REQUEST_ALREADY_WAITING')) return 'waiting';
    if (message.includes('REQUEST_ALREADY_APPROVED')) return 'approved';
    onFailure?.(error);
    return 'failed';
  } catch (error) {
    onFailure?.(error);
    return 'failed';
  }
}
